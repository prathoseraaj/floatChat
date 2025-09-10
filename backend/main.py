import os
import json
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, text
import chromadb
from chromadb.utils import embedding_functions # <-- CRITICAL IMPORT
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

# --- Pydantic Models for API Validation ---
class ChatQuery(BaseModel):
    query: str

class ChatResponse(BaseModel):
    insights: str
    plotly_json: dict | None = None
    sql_query: str

# --- Core RAG Functions ---

# In your main.py file

# In main.py, replace this function

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
    """LLM Call #3: Generates Plotly JSON for visualization."""
    if data.empty or len(data) < 2:
        return None

    # --- FIX: Create a smaller sample of the data for the prompt ---
    data_sample = data.head(50).to_string()

    prompt = f"""
    The user asked: "{user_query}".
    Here is a sample of the first 50 rows of the data:
    {data_sample}

    Task: Generate a JSON object for a Plotly chart that visualizes the FULL dataset's structure based on this sample.
    - The JSON should be a dictionary with 'data' and 'layout' keys.
    - Choose the best chart type (e.g., scatter, line, scatter_mapbox).
    - If the user asks about location, a 'scatter_mapbox' is best. Use latitude and longitude.
    - For profiles, a scatter plot of temperature or salinity vs. pressure (depth) is best. Invert the y-axis for pressure.
    - Make the chart visually appealing with clear titles and labels.
    - Respond with ONLY the JSON object and nothing else.
    """
    try:
        response = model.generate_content(prompt)
        json_str = response.text.strip().replace('```json', '').replace('```', '')
        # IMPORTANT: The LLM will generate the plot code, but your FRONTEND will plot the FULL dataframe.
        # This code generates the RECIPE, your frontend does the COOKING with all ingredients.
        plot_recipe = json.loads(json_str)
        
        # Now we replace the sample data in the recipe with ALL the data.
        # This is a robust way to handle large datasets.
        if 'data' in plot_recipe and len(plot_recipe['data']) > 0:
            # Assuming the first trace is the one we want to populate
            trace = plot_recipe['data'][0]
            if 'lat' in trace: # Handle mapbox case
                trace['lat'] = data['latitude'].tolist()
                trace['lon'] = data['longitude'].tolist()
            if 'x' in trace and 'y' in trace: # Handle scatter/line case
                # Infer which columns to use based on the LLM's recipe
                x_col = data.columns[data.columns.str.contains(trace.get('name', 'x').lower())][0]
                y_col = data.columns[data.columns.str.contains(trace.get('name', 'y').lower())][0]
                trace['x'] = data[x_col].tolist()
                trace['y'] = data[y_col].tolist()

        return plot_recipe

    except Exception as e:
        print(f"Error generating visualization: {e}")
        return None

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