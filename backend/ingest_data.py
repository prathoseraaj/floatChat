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
            # Open the NetCDF file
            with xr.open_dataset(file_path) as ds:
                # Convert to a Pandas DataFrame
                df = ds.to_dataframe().reset_index()
                # Clean up the data (select columns, rename, etc.)
                # This step is important! You need to make sure the columns are consistent.
                # Example:
                # df = df[['LATITUDE', 'LONGITUDE', 'DEEPEST_PRES', 'TEMP', 'PSAL']]
                # df = df.rename(columns={'LATITUDE': 'latitude', 'LONGITUDE': 'longitude'})
                
                # Write the DataFrame to the SQL table
                # 'argo_profiles' is the name of the table we are creating.
                # if_exists='append' adds the data from each new file to the table.
                df.to_sql('argo_profiles', engine, if_exists='append', index=False)

        except Exception as e:
            print(f"Could not process {file_path}. Error: {e}")

print("Data ingestion complete!")