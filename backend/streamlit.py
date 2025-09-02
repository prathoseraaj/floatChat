import streamlit as st
import pandas as pd
from sqlalchemy import create_engine

db_url = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
engine = create_engine(db_url)

query = "SELECT * FROM argo_profiles LIMIT 1000"
df = pd.read_sql(query, engine)

st.title("Argo Profiles Table")
st.write(df)