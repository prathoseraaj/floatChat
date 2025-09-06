import chromadb
import google.generativeai as genai
from chromadb.utils import embedding_functions
import os
from dotenv import load_dotenv

load_dotenv()

gemini_api_key = os.getenv("gemini_api_key")

genai.configure(api_key=gemini_api_key)

google_ef = embedding_functions.GoogleGenerativeAiEmbeddingFunction(api_key=gemini_api_key)

client = chromadb.PersistentClient(path='chroma_db')

collection = client.get_or_create_collection(name='argo_schema', embedding_function=google_ef)

#discription this is for our knowledge
schema_description = """
The user can query a PostgreSQL database table named 'argo_profiles'.
This table contains oceanographic data from ARGO floats and has the following columns:
- platform_id: The unique identifier for the ARGO float.
- cycle_number: The specific profile cycle number for the float.
- latitude: The latitude of the measurement in degrees.
- longitude: The longitude of the measurement in degrees.
- timestamp: The date and time of the measurement.
- pressure: The pressure in decibars, which indicates the depth.
- temperature: The water temperature in Celsius.
- salinity: The water salinity in Practical Salinity Units.
The table is clean and contains no null values.
"""

collection.add(documents=[schema_description],ids=["argo_schema_main"])