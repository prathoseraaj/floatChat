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

