import xarray as xr
import pandas as pd
from sqlalchemy import create_engine
import os


db_url = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
engine = create_engine(db_url)


data_directory = "./argo_data/"


for filename in os.listdir(data_directory):
    if filename.endswith(".nc"):
        file_path = os.path.join(data_directory, filename)
        
        print(f"Processing {file_path}...")
        
        try:
            with xr.open_dataset(file_path) as ds:
                df = ds.to_dataframe().reset_index()

                # --- NEW: Define a function to decode bytes to string ---
                def decode_if_bytes(b):
                    if isinstance(b, bytes):
                        # Decode bytes to a utf-8 string and remove trailing whitespace
                        return b.decode('utf-8').strip()
                    return b

                # --- NEW: Apply the decoding function to byte columns ---
                # PLATFORM_NUMBER and DATA_TYPE are common culprits. Add any others you find.
                byte_columns = ['PLATFORM_NUMBER', 'DATA_TYPE']
                for col in byte_columns:
                    if col in df.columns:
                        df[col] = df[col].apply(decode_if_bytes)

                # --- The rest of your cleaning and renaming logic ---
                core_columns = {
                    'PLATFORM_NUMBER': 'platform_id',
                    'CYCLE_NUMBER': 'cycle_number',
                    'LATITUDE': 'latitude',
                    'LONGITUDE': 'longitude',
                    'JULD': 'timestamp',
                    'PRES_ADJUSTED': 'pressure',
                    'TEMP_ADJUSTED': 'temperature',
                    'PSAL_ADJUSTED': 'salinity'
                }
                
                df_clean = df[list(core_columns.keys())]
                df_clean = df_clean.rename(columns=core_columns)
                df_clean = df_clean.dropna()

                # Write the CLEAN DataFrame to the SQL table
                df_clean.to_sql('argo_profiles', engine, if_exists='append', index=False)

        except Exception as e:
            print(f"Could not process {file_path}. Error: {e}")

print("Data ingestion complete!")