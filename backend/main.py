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

load_dotenv()

try:
    api_key = os.getenv("gemini_api_key")
    if not api_key:
        raise ValueError("gemini_api_key not found in environment variables.")
    genai.configure(api_key=api_key)
except (ValueError, AttributeError) as e:
    print(f"⚠️  Error configuring Gemini API: {e}")
    exit()

try:
    DB_URL = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
    engine = create_engine(DB_URL)
except Exception as e:
    print(f"⚠️  Error connecting to PostgreSQL: {e}")
    exit()

from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

hf_ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

try:
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    schema_collection = chroma_client.get_collection(
        name="argo_schema",
        embedding_function=hf_ef
    )
except Exception as e:
    print(f"⚠️  Error initializing ChromaDB: {e}")
    exit()

model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI(
    title="FloatChat API",
    description="API for querying ARGO float data using natural language."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:8080"], 
    allow_credentials=True,
    allow_methods=["*"], # You can be more specific, e.g., ["GET", "POST"]
    allow_headers=["*"],
)

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

    --- GEOGRAPHIC KNOWLEDGE FOR INDIAN OCEAN ---
    - Arabian Sea: latitude 10°N to 25°N, longitude 50°E to 80°E (lat BETWEEN 10 AND 25 AND lon BETWEEN 50 AND 80)
    - Bay of Bengal: latitude 5°N to 25°N, longitude 80°E to 100°E (lat BETWEEN 5 AND 25 AND lon BETWEEN 80 AND 100)
    - Equator region: latitude -5°N to 5°N (lat BETWEEN -5 AND 5)
    - Indian Ocean Central: latitude -40°S to 25°N, longitude 20°E to 120°E
    - Near/around terms: use ±2-5 degree range around specific coordinates
    - "Nearest" or "closest": use latitude and longitude to find proximity

    --- IMPORTANT RULES ---
    - When a user asks for 'locations', 'map', or 'trajectory', you MUST use GROUP BY platform_id, cycle_number, latitude, longitude to get a single, unique point for each profile.
    - For geographic queries without date filters, always add LIMIT 2000 to prevent overwhelming results
    - Use latitude/longitude column names exactly as they appear in the schema (likely 'latitude', 'longitude' or 'lat', 'lon')
    - When using GROUP BY, you can only ORDER BY columns that are in the GROUP BY clause or use aggregate functions
    
    --- DATA SAMPLING RULES ---
    - If the user does NOT specify a date range, time period, or specific year/month:
      * For visualizations: Use LIMIT 2000 to sample data for better performance
      * For geographic queries: Use LIMIT 2000 to get good spatial coverage
      * For profiles/depth data: Use LIMIT 1000 to prevent browser lag
    - If the user specifies dates, years, or time ranges, return all data in that range
    - For summary statistics (count, avg, min, max), don't limit the data
    - For queries with GROUP BY: ORDER BY columns that are in the GROUP BY clause only (e.g., ORDER BY platform_id, latitude)
    - For queries without GROUP BY: You can ORDER BY timestamp DESC or any column

    --- EXAMPLE GEOGRAPHIC QUERIES ---
    - "Arabian Sea": WHERE latitude BETWEEN 10 AND 25 AND longitude BETWEEN 50 AND 80 LIMIT 2000
    - "near equator": WHERE latitude BETWEEN -5 AND 5 LIMIT 2000  
    - "salinity profiles near equator": WHERE latitude BETWEEN -5 AND 5 AND salinity IS NOT NULL LIMIT 1000
    - "nearest ARGO floats to Arabian Sea": SELECT platform_id, cycle_number, latitude, longitude FROM argo_profiles WHERE latitude BETWEEN 10 AND 25 AND longitude BETWEEN 50 AND 80 GROUP BY platform_id, cycle_number, latitude, longitude ORDER BY platform_id LIMIT 2000

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
    if len(data) <= 1500:
        return data
    
    # Check if user specified date/time constraints
    time_keywords = ['year', 'month', 'date', 'time', 'recent', 'latest', 'last', 'since', 'before', 'after', 'between', '2020', '2021', '2022', '2023', '2024']
    has_time_filter = any(keyword in user_query.lower() for keyword in time_keywords)
    
    # If user specified time constraints, don't sample
    if has_time_filter:
        return data
    
    print(f"Large dataset detected ({len(data)} rows). Sampling for better visualization...")
    
    # Strategy 1: For geographic data, ensure good spatial distribution
    if 'latitude' in data.columns and 'longitude' in data.columns:
        # Sort by latitude and longitude to get good geographic spread
        data_sorted = data.sort_values(['latitude', 'longitude'])
        step = max(1, len(data) // 1200)  # Sample to get ~1200 points for good geographic coverage
        sampled_data = data_sorted.iloc[::step]
        print(f"Geographic sampling: {len(sampled_data)} rows selected with spatial distribution")
        return sampled_data
    
    # Strategy 2: Time-based sampling if timestamp exists
    elif 'timestamp' in data.columns:
        # Sort by timestamp and take every Nth row to get even distribution
        data_sorted = data.sort_values('timestamp')
        step = max(1, len(data) // 1200)  # Sample to get ~1200 points
        sampled_data = data_sorted.iloc[::step]
        print(f"Time-based sampling: {len(sampled_data)} rows selected")
        return sampled_data
    
    # Strategy 3: For profile data (temperature, salinity vs pressure)
    elif 'pressure' in data.columns and any(col in data.columns for col in ['temperature', 'salinity', 'daily_average_temperature']):
        # For oceanographic profiles, sample across pressure ranges
        if len(data) > 2000:
            # Take every Nth row to maintain profile structure
            step = max(1, len(data) // 1200)
            sampled_data = data.iloc[::step]
            print(f"Profile sampling: {len(sampled_data)} rows selected")
            return sampled_data
        else:
            return data
    
    # Strategy 4: Random sampling if no specific structure detected
    sample_size = min(1200, len(data))
    sampled_data = data.sample(n=sample_size, random_state=42)
    print(f"Random sampling: {len(sampled_data)} rows selected")
    return sampled_data

def generate_insights(user_query: str, data: pd.DataFrame) -> str:
    """LLM Call #2: Generates textual insights from the data."""
    if data.empty:
        return "No data was found for your query. This could be because the geographic region you specified doesn't have ARGO float data, or the search parameters were too restrictive. Try expanding your search area or checking if the region has ARGO float coverage."
    
    # Create a comprehensive data summary for better insights
    data_summary = {
        "total_records": len(data),
        "columns": data.columns.tolist(),
        "date_range": None,
        "geographic_range": None,
        "key_stats": {}
    }
    
    # Get date range if timestamp exists
    timestamp_cols = [col for col in data.columns if 'date' in col.lower() or 'time' in col.lower()]
    if timestamp_cols:
        try:
            date_col = timestamp_cols[0]
            data_summary["date_range"] = f"From {data[date_col].min()} to {data[date_col].max()}"
        except:
            pass
    
    # Get geographic range if lat/lon exists
    if 'latitude' in data.columns and 'longitude' in data.columns:
        data_summary["geographic_range"] = f"Latitude: {data['latitude'].min():.2f}° to {data['latitude'].max():.2f}°, Longitude: {data['longitude'].min():.2f}° to {data['longitude'].max():.2f}°"
    elif 'lat' in data.columns and 'lon' in data.columns:
        data_summary["geographic_range"] = f"Latitude: {data['lat'].min():.2f}° to {data['lat'].max():.2f}°, Longitude: {data['lon'].min():.2f}° to {data['lon'].max():.2f}°"
    
    # Get key statistics for numeric columns
    numeric_cols = data.select_dtypes(include=['number']).columns.tolist()
    for col in numeric_cols[:3]:  # Top 3 numeric columns
        if not data[col].isna().all():
            data_summary["key_stats"][col] = {
                "min": float(data[col].min()),
                "max": float(data[col].max()),
                "mean": float(data[col].mean())
            }
    
    # Create a sample of the actual data
    data_sample = data.head(20).to_string(max_rows=20, max_cols=10, float_format='%.2f')
        
    prompt = f"""
    The user asked: "{user_query}"
    
    ARGO Float Data Summary:
    - Total records found: {data_summary['total_records']}
    - Available columns: {', '.join(data_summary['columns'][:10])}
    {f"- Date range: {data_summary['date_range']}" if data_summary['date_range'] else ""}
    {f"- Geographic coverage: {data_summary['geographic_range']}" if data_summary['geographic_range'] else ""}
    
    Key Statistics:
    {json.dumps(data_summary['key_stats'], indent=2) if data_summary['key_stats'] else "No numeric data available"}
    
    Sample Data (first 20 rows):
    {data_sample}

    CONTEXT: This is oceanographic data from ARGO floats in the Indian Ocean region. ARGO floats are autonomous instruments that measure temperature, salinity, and pressure profiles in the ocean.

    Based on this ARGO float data, provide a friendly and informative insight in 4-6 sentences. Include:
    1. What the data shows about the ocean conditions
    2. Any interesting patterns or values you notice
    3. The geographic or temporal scope of the data
    4. Relevant oceanographic context for the Indian Ocean region

    Make it conversational and educational, as if explaining to someone interested in ocean science.
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
                        "title": {
                            "text": f"{numeric_cols[0]} over {datetime_col} (Sampled: {data_size} points)",
                            "font": {"size": 16}
                        },
                        "xaxis": {
                            "title": {
                                "text": datetime_col.replace('_', ' ').title()[:30] + ("..." if len(datetime_col) > 30 else ""),
                                "font": {"size": 13},
                                "standoff": 20
                            }
                        },
                        "yaxis": {
                            "title": {
                                "text": numeric_cols[0].replace('_', ' ').title()[:30] + ("..." if len(numeric_cols[0]) > 30 else ""),
                                "font": {"size": 13},
                                "standoff": 20
                            }
                        },
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
                    "line": {"color": "red", "width": 2},
                    "marker": {"size": 4}
                }],
                "layout": {
                    "title": {
                        "text": "Temperature vs Pressure Profile",
                        "font": {"size": 16}
                    },
                    "xaxis": {
                        "title": {
                            "text": "Temperature (°C)",
                            "font": {"size": 13},
                            "standoff": 20
                        }
                    },
                    "yaxis": {
                        "title": {
                            "text": "Pressure (dbar)",
                            "font": {"size": 13},
                            "standoff": 20
                        },
                        "autorange": "reversed"
                    },
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
                        "name": "Data Relationship",
                        "line": {"color": "rgb(31, 119, 180)", "width": 2},
                        "marker": {"size": 4}
                    }],
                    "layout": {
                        "title": {
                            "text": f"{numeric_cols[1]} vs {numeric_cols[0]}",
                            "font": {"size": 16}
                        },
                        "xaxis": {
                            "title": {
                                "text": numeric_cols[0].replace('_', ' ').title()[:25] + ("..." if len(numeric_cols[0]) > 25 else ""),
                                "font": {"size": 13},
                                "standoff": 20
                            }
                        },
                        "yaxis": {
                            "title": {
                                "text": numeric_cols[1].replace('_', ' ').title()[:25] + ("..." if len(numeric_cols[1]) > 25 else ""),
                                "font": {"size": 13},
                                "standoff": 20
                            }
                        },
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
        print(f"Processing query: {chat_query.query}")
        
        # Generate SQL query
        sql_query = generate_sql_from_query(chat_query.query)
        print(f"Generated SQL: {sql_query}")
        
        # Execute SQL query
        data_df = execute_sql_query(sql_query)
        print(f"Query returned {len(data_df)} rows")
        
        # Debug: Print column names and first few rows if data exists
        if not data_df.empty:
            print(f"Columns: {data_df.columns.tolist()}")
            print(f"Sample data shape: {data_df.shape}")
            if len(data_df) > 0:
                print(f"First row sample: {data_df.iloc[0].to_dict()}")
        else:
            print("No data returned from SQL query")
        
        # Sample large datasets for better visualization
        sampled_data_df = sample_large_dataset(data_df, chat_query.query)
        print(f"Sampled data: {len(sampled_data_df)} rows for visualization")
        
        # Generate insights using full data
        insights = generate_insights(chat_query.query, data_df)
        
        # Generate visualization using sampled data
        plotly_json = generate_visualization(chat_query.query, sampled_data_df)
        
        return ChatResponse(
            insights=insights,
            plotly_json=plotly_json,
            sql_query=sql_query
        )
    except Exception as e:
        print(f"An error occurred in the chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")