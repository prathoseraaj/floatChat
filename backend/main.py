import os
import json
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
import chromadb
from chromadb.utils import embedding_functions
import google.generativeai as genai
from dotenv import load_dotenv

# --- Configuration & Initializations ---
load_dotenv()

# Configure the Gemini API key
try:
    api_key = os.getenv("gemini_api_key")
    if not api_key:
        raise ValueError("gemini_api_key not found in environment variables.")
    genai.configure(api_key=api_key)
except (ValueError, AttributeError) as e:
    print(f"⚠️  Error configuring Gemini API: {e}")
    exit()

# Connect to the PostgreSQL database
try:
    DB_URL = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
    engine = create_engine(DB_URL)
except Exception as e:
    print(f"⚠️  Error connecting to PostgreSQL: {e}")
    exit()

# --- THIS IS THE FIX ---
# We must explicitly define the Google embedding function to ensure consistency.
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

# Use HuggingFace Sentence Transformer (runs locally, no API calls)
hf_ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

# Connect to ChromaDB, ensuring we use the HuggingFace embedding function
try:
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    schema_collection = chroma_client.get_collection(
        name="argo_schema",
        embedding_function=hf_ef
    )
except Exception as e:
    print(f"⚠️  Error initializing ChromaDB: {e}")
    exit()

# Initialize the generative model
model = genai.GenerativeModel('gemini-2.5-flash')

# --- FastAPI App ---
app = FastAPI(
    title="FloatChat API",
    description="API for querying ARGO float data using natural language."
)

# --- FastAPI App ---
app = FastAPI(
    title="FloatChat API",
    description="API for querying ARGO float data using natural language."
)

# --- ADD CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    # 👇 ADD YOUR FRONTEND'S ADDRESS TO THIS LIST
    allow_origins=["http://localhost:8081", "http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:8080"], 
    allow_credentials=True,
    allow_methods=["*"], # You can be more specific, e.g., ["GET", "POST"]
    allow_headers=["*"],
)

# --- Pydantic Models for API Validation ---
class LocationData(BaseModel):
    lat: float
    lon: float
    label: str | None = None

class ChatQuery(BaseModel):
    query: str

class ChatResponse(BaseModel):
    insights: str
    plotly_json: dict | None = None
    sql_query: str
    locations: list[LocationData] | None = None

# --- Core RAG Functions ---

def generate_sql_from_query(user_query: str) -> str:
    """LLM Call #1: Performs RAG to generate a SQL query."""
    
    results = schema_collection.query(query_texts=[user_query], n_results=1)
    schema_context = results['documents'][0][0]

    prompt = f"""
    Based on the database schema below, write a PostgreSQL query that answers the user's question.
    - Respond with only the SQL query and nothing else.
    - Do not use backticks or markdown.
    - The table is named 'argo_profiles'.
    - The 'platform_id' column is of type TEXT and requires single quotes in a WHERE clause.

    --- IMPORTANT RULE ---
    - When a user asks for 'locations', 'map', or 'trajectory', you MUST use GROUP BY platform_id, cycle_number, latitude, longitude to get a single, unique point for each profile.

    Schema:
    {schema_context}

    User Question: "{user_query}"

    SQL Query:
    """
    response = model.generate_content(prompt)
    sql_query = response.text.strip().replace('`', '')
    print(f"Generated SQL: {sql_query}")
    return sql_query

def execute_sql_query(sql_query: str) -> pd.DataFrame:
    """Executes the SQL query on the PostgreSQL database."""
    with engine.connect() as connection:
        return pd.read_sql_query(text(sql_query), connection)

def extract_locations_from_data(data_df: pd.DataFrame, user_query: str) -> list[LocationData] | None:
    """Extract location data if the query involves geographic data."""
    if data_df.empty:
        return None
    
    # Check if we have lat/lon columns
    if 'latitude' in data_df.columns and 'longitude' in data_df.columns:
        locations = []
        for _, row in data_df.head(100).iterrows():  # Limit for performance
            if pd.notna(row['latitude']) and pd.notna(row['longitude']):
                # Create a label based on available data
                label_parts = []
                if 'platform_id' in row and pd.notna(row['platform_id']):
                    label_parts.append(f"Platform {row['platform_id']}")
                if 'cycle_number' in row and pd.notna(row['cycle_number']):
                    label_parts.append(f"Cycle {row['cycle_number']}")
                
                label = " - ".join(label_parts) if label_parts else f"Lat: {row['latitude']:.2f}, Lon: {row['longitude']:.2f}"
                
                locations.append(LocationData(
                    lat=float(row['latitude']),
                    lon=float(row['longitude']),
                    label=label
                ))
        return locations if locations else None
    
    return None

def generate_insights(user_query: str, data: pd.DataFrame) -> str:
    """LLM Call #2: Generates textual insights from the data."""
    if data.empty:
        return "No data was found for your query, so no insights could be generated."
    
    # --- FIX: Create a smaller sample of the data for the prompt ---
    data_sample = data.head(50).to_string()
        
    prompt = f"""
    The user asked the following question: "{user_query}".
    The following is a sample of the first 50 rows of data retrieved from the database:
    {data_sample}

    Based on this data sample, provide a short, friendly, one or two-sentence insight.
    """
    response = model.generate_content(prompt)
    return response.text.strip()

def generate_visualization(user_query: str, data: pd.DataFrame) -> dict | None:
    """Generate Plotly JSON visualization with better defaults."""
    if data.empty or len(data) < 2:
        return None

    try:
        columns = data.columns.tolist()
        print(f"Available columns: {columns}")

        # 1. Map Visualization
        if "latitude" in columns and "longitude" in columns:
            plot_data = {
                "data": [{
                    "type": "scattermapbox",
                    "lat": data["latitude"].tolist(),
                    "lon": data["longitude"].tolist(),
                    "mode": "markers",
                    "marker": {"size": 8, "color": "blue"},
                    "name": "Float Locations"
                }],
                "layout": {
                    "title": "Float Locations",
                    "mapbox": {"style": "open-street-map", "center": {"lat": 0, "lon": 0}, "zoom": 1},
                    "height": 500
                }
            }

        # 2. Time Series (auto-detect datetime column)
        elif any(pd.api.types.is_datetime64_any_dtype(data[col]) for col in columns):
            datetime_col = [col for col in columns if pd.api.types.is_datetime64_any_dtype(data[col])][0]
            numeric_cols = data.select_dtypes(include=['number']).columns.tolist()
            if numeric_cols:
                plot_data = {
                    "data": [{
                        "type": "scatter",
                        "x": data[datetime_col].tolist(),
                        "y": data[numeric_cols[0]].tolist(),
                        "mode": "lines+markers",
                        "name": f"{numeric_cols[0]} over time",
                        "line": {"color": "rgb(31, 119, 180)"},
                        "marker": {"size": 6}
                    }],
                    "layout": {
                        "title": f"{numeric_cols[0]} over {datetime_col}",
                        "xaxis": {"title": datetime_col},
                        "yaxis": {"title": numeric_cols[0]},
                        "height": 500
                    }
                }
            else:
                return None

        # 3. Temperature vs Pressure Profile
        elif "pressure" in columns and any(temp_col in columns for temp_col in ["temperature", "daily_average_temperature"]):
            temp_col = "temperature" if "temperature" in columns else "daily_average_temperature"
            plot_data = {
                "data": [{
                    "type": "scatter",
                    "x": data[temp_col].tolist(),
                    "y": data["pressure"].tolist(),
                    "mode": "lines+markers",
                    "name": "Temperature Profile",
                    "line": {"color": "red"},
                    "marker": {"size": 6}
                }],
                "layout": {
                    "title": "Temperature vs Pressure Profile",
                    "xaxis": {"title": "Temperature (°C)"},
                    "yaxis": {"title": "Pressure (dbar)", "autorange": "reversed"},
                    "height": 500
                }
            }

        # 4. Default numeric scatter or line
        else:
            numeric_cols = data.select_dtypes(include=["number"]).columns.tolist()
            if len(numeric_cols) >= 2:
                plot_data = {
                    "data": [{
                        "type": "scatter",
                        "x": data[numeric_cols[0]].tolist(),
                        "y": data[numeric_cols[1]].tolist(),
                        "mode": "lines+markers",
                        "name": "Data Relationship"
                    }],
                    "layout": {
                        "title": f"{numeric_cols[1]} vs {numeric_cols[0]}",
                        "xaxis": {"title": numeric_cols[0]},
                        "yaxis": {"title": numeric_cols[1]},
                        "height": 500
                    }
                }
            else:
                return None

        print(f"Generated plot: {plot_data['layout']['title']}")
        return plot_data

    except Exception as e:
        print(f"Error generating visualization: {e}")
        return None

# --- ADD A HEALTH CHECK ENDPOINT ---
@app.get("/")
def read_root():
    return {"message": "FloatChat API is running! 🌊"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# --- Main API Endpoint ---
@app.post("/chat", response_model=ChatResponse)
def handle_chat_query(chat_query: ChatQuery):
    try:
        sql_query = generate_sql_from_query(chat_query.query)
        data_df = execute_sql_query(sql_query)
        insights = generate_insights(chat_query.query, data_df)
        plotly_json = generate_visualization(chat_query.query, data_df)
        locations = extract_locations_from_data(data_df, chat_query.query)
        
        return ChatResponse(
            insights=insights,
            plotly_json=plotly_json,
            sql_query=sql_query,
            locations=locations
        )
    except Exception as e:
        print(f"An error occurred in the chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))