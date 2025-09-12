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
class ChatQuery(BaseModel):
    query: str

class ChatResponse(BaseModel):
    insights: str
    plotly_json: dict | None = None
    sql_query: str

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

    --- IMPORTANT RULES ---
    - When a user asks for 'locations', 'map', or 'trajectory', you MUST use GROUP BY platform_id, cycle_number, latitude, longitude to get a single, unique point for each profile.
    
    --- DATA SAMPLING RULES ---
    - If the user does NOT specify a date range, time period, or specific year/month, and asks for visualizations (graphs, plots, charts):
      * Use TABLESAMPLE SYSTEM (5) or LIMIT 1000 to sample data for better visualization
      * Or use WHERE MOD(EXTRACT(DOY FROM timestamp), 30) = 0 to get one sample per month
      * This prevents overwhelming visualizations with 40,000+ data points
    - If the user specifies dates, years, or time ranges, return all data in that range
    - For summary statistics (count, avg, min, max), don't limit the data

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

def sample_large_dataset(data: pd.DataFrame, user_query: str) -> pd.DataFrame:
    """Sample large datasets for better visualization when no date filter is specified."""
    
    # If dataset is small enough, return as is
    if len(data) <= 1000:
        return data
    
    # Check if user specified date/time constraints
    time_keywords = ['year', 'month', 'date', 'time', 'recent', 'latest', 'last', 'since', 'before', 'after', 'between']
    has_time_filter = any(keyword in user_query.lower() for keyword in time_keywords)
    
    # If user specified time constraints, don't sample
    if has_time_filter:
        return data
    
    print(f"Large dataset detected ({len(data)} rows). Sampling for better visualization...")
    
    # Sample strategy 1: If timestamp column exists, take every Nth row based on time
    if 'timestamp' in data.columns:
        # Sort by timestamp and take every Nth row to get even distribution
        data_sorted = data.sort_values('timestamp')
        step = max(1, len(data) // 1000)  # Sample to get ~1000 points
        sampled_data = data_sorted.iloc[::step]
        print(f"Time-based sampling: {len(sampled_data)} rows selected")
        return sampled_data
    
    # Sample strategy 2: Random sampling if no timestamp
    sample_size = min(1000, len(data))
    sampled_data = data.sample(n=sample_size, random_state=42)
    print(f"Random sampling: {len(sampled_data)} rows selected")
    return sampled_data

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
    """Generate Plotly JSON visualization (without map/location plots)."""
    if data.empty or len(data) < 2:
        return None

    try:
        columns = data.columns.tolist()
        print(f"Available columns: {columns}")

        # 1. Time Series (auto-detect datetime column)
        if any(pd.api.types.is_datetime64_any_dtype(data[col]) for col in columns):
            datetime_col = [col for col in columns if pd.api.types.is_datetime64_any_dtype(data[col])][0]
            numeric_cols = data.select_dtypes(include=['number']).columns.tolist()
            if numeric_cols:
                # Adjust visualization style based on data size
                data_size = len(data)
                if data_size > 500:
                    mode = "lines"  # Only lines for large datasets
                    marker_size = 3
                elif data_size > 100:
                    mode = "lines+markers"
                    marker_size = 4
                else:
                    mode = "lines+markers"
                    marker_size = 6
                
                plot_data = {
                    "data": [{
                        "type": "scatter",
                        "x": data[datetime_col].tolist(),
                        "y": data[numeric_cols[0]].tolist(),
                        "mode": mode,
                        "name": f"{numeric_cols[0]} over time ({data_size} points)",
                        "line": {"color": "rgb(31, 119, 180)", "width": 2},
                        "marker": {"size": marker_size, "color": "rgb(31, 119, 180)"}
                    }],
                    "layout": {
                        "title": f"{numeric_cols[0]} over {datetime_col} (Sampled: {data_size} points)",
                        "xaxis": {"title": datetime_col},
                        "yaxis": {"title": numeric_cols[0]},
                        "height": 500,
                        "showlegend": True
                    }
                }
                print(f"Generated plot: {plot_data['layout']['title']}")
                return plot_data
            else:
                return None

        # 2. Temperature vs Pressure Profile
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
            print(f"Generated plot: {plot_data['layout']['title']}")
            return plot_data

        # 3. Default numeric scatter or line
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
                print(f"Generated plot: {plot_data['layout']['title']}")
                return plot_data
            else:
                return None

        # If nothing matches
        return None

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
        
        # Sample large datasets for better visualization
        sampled_data_df = sample_large_dataset(data_df, chat_query.query)
        
        insights = generate_insights(chat_query.query, data_df)  # Use full data for insights
        plotly_json = generate_visualization(chat_query.query, sampled_data_df)  # Use sampled data for visualization
        
        return ChatResponse(
            insights=insights,
            plotly_json=plotly_json,
            sql_query=sql_query
        )
    except Exception as e:
        print(f"An error occurred in the chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))