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
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

    # Replace your old prompt with this new one
    prompt = f"""
    Based on the database schema provided, write a single PostgreSQL query that answers the user's question.
    - The table name is argo_profiles.
    - Respond with ONLY the SQL query and nothing else. No explanation, no markdown.

    --- RULES ---
    1. For location-based queries ('map', 'location'), you MUST select latitude, longitude, platform_id, and cycle_number and GROUP BY all four columns to get unique points.
    2. For time-series queries ('over time', 'daily'), you MUST select the 'timestamp' column and rename it to 'measurement_date' using 'AS'. For example: SELECT timestamp AS measurement_date, temperature FROM ...
    3. For profile queries ('profile', 'vs pressure'), you MUST select 'pressure' and 'temperature' or 'salinity'.
    4. **CRITICAL RULE**: If a 'profile' is requested for a specific 'platform_id' BUT no 'cycle_number' is mentioned, you MUST query for the latest cycle only. Use a subquery to find the MAX(cycle_number). Example: ... WHERE platform_id = '...' AND cycle_number = (SELECT MAX(cycle_number) FROM argo_profiles WHERE platform_id = '...')

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

def generate_insights(user_query: str, data: pd.DataFrame) -> str:
    """LLM Call #2: Generates data-rich insights."""
    if data.empty:
        return "No data was found for your query, so no insights could be generated."
    
    data_sample = data.head(50).to_string()
        
    # Replace your old prompt with this new, more detailed one
    prompt = f"""
    You are an expert oceanographer's assistant. Based on the user's question and the data sample below, provide a concise and data-rich insight in a single paragraph (2-3 sentences).

    User's Question: "{user_query}"

    Data Sample:
    {data_sample}

    --- Your Task ---
    1.  Identify the type of data (e.g., a temperature-pressure profile).
    2.  State the range of the key variables. For a profile, mention the surface and deep temperatures and the maximum pressure (depth).
    3.  Describe the primary trend and point out where the temperature changes most rapidly (the thermocline).
    """
    response = model.generate_content(prompt)
    return response.text.strip()

def generate_visualization(user_query: str, data: pd.DataFrame) -> dict | None:
    """Generates Plotly JSON for visualization."""
    if data.empty or len(data) < 2:
        return None

    try:
        columns = data.columns.tolist()
        print(f"Available columns: {columns}")
        
        # This function has been simplified for clarity.
        # The main change is in the 'elif' block for profiles.

        if 'pressure' in columns and any(temp_col in columns for temp_col in ['temperature', 'daily_average_temperature']):
            # Profile visualization (temperature vs pressure)
            temp_col = 'temperature' if 'temperature' in columns else 'daily_average_temperature'
            plot_data = {
                "data": [{
                    "type": "scatter",
                    "x": data[temp_col].tolist(),
                    "y": data['pressure'].tolist(),
                    # CHANGED: "markers" is now "lines+markers" to connect the dots
                    "mode": "lines+markers", 
                    "name": "Temperature Profile",
                    "marker": {"size": 5, "color": "red"},
                    "line": {"color": "red", "width": 2}
                }],
                "layout": {
                    "title": "Temperature vs Pressure Profile",
                    "xaxis": {"title": "Temperature (°C)"},
                    "yaxis": {"title": "Pressure (dbar)", "autorange": "reversed"},
                    "height": 500
                }
            }
        # ... (other elif/else blocks for maps, time-series, etc. remain the same)
        else:
            # Default scatter plot using first two numeric columns
            numeric_cols = data.select_dtypes(include=['number']).columns.tolist()
            if len(numeric_cols) >= 2:
                plot_data = {
                    "data": [{
                        "type": "scatter",
                        "x": data[numeric_cols[0]].tolist(),
                        "y": data[numeric_cols[1]].tolist(),
                        "mode": "lines+markers", # Also changed here for better default
                        "name": "Data Points",
                        "marker": {"size": 6}
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
        
        return ChatResponse(
            insights=insights,
            plotly_json=plotly_json,
            sql_query=sql_query
        )
    except Exception as e:
        print(f"An error occurred in the chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))