import os
import pandas as pd
import xarray as xr
from sqlalchemy import create_engine, String, Integer, Float, DateTime

# --- Configuration ---
DB_URL = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
DATA_DIRECTORY = "./argo_data/"
TABLE_NAME = "argo_profiles"
YEAR_FILTER = 2024

engine = create_engine(DB_URL)

def get_best_available_column(ds, potential_names):
    """Finds the best available variable name from a list."""
    for name in potential_names:
        if name in ds.variables and pd.notna(ds[name].values).any():
            return name
    return None

def ingest_data():
    """Finds, processes, and ingests ARGO .nc files into the database."""
    all_clean_dataframes = []
    
    nc_files = [f for f in os.listdir(DATA_DIRECTORY) if f.endswith('.nc')]
    if not nc_files:
        print(f"❌ No .nc files found in '{DATA_DIRECTORY}'.")
        return

    print(f"Found {len(nc_files)} files to process...")

    for filename in nc_files:
        file_path = os.path.join(DATA_DIRECTORY, filename)
        print(f"Processing: {filename}...")

        try:
            with xr.open_dataset(file_path, decode_times=False) as ds:
                col_map = {
                    'platform_id': get_best_available_column(ds, ['PLATFORM_NUMBER']),
                    'cycle_number': get_best_available_column(ds, ['CYCLE_NUMBER']),
                    'latitude': get_best_available_column(ds, ['LATITUDE']),
                    'longitude': get_best_available_column(ds, ['LONGITUDE']),
                    'timestamp': get_best_available_column(ds, ['JULD']),
                    'pressure': get_best_available_column(ds, ['PRES_ADJUSTED', 'PRES']),
                    'temperature': get_best_available_column(ds, ['TEMP_ADJUSTED', 'TEMP']),
                    'salinity': get_best_available_column(ds, ['PSAL_ADJUSTED', 'PSAL'])
                }

                found_cols = {k: v for k, v in col_map.items() if v is not None}
                
                if len(found_cols) < 5:
                    print(f"  -> Skipping {filename}: Not enough core data columns found.")
                    continue
                    
                df = ds[list(found_cols.values())].to_dataframe().reset_index()
                rename_map = {v: k for k, v in found_cols.items()}
                df = df.rename(columns=rename_map)

                for col in df.columns:
                    if df[col].dtype == 'object' and len(df[col].dropna()) > 0:
                        if isinstance(df[col].dropna().iloc[0], bytes):
                            df[col] = df[col].str.decode('utf-8').str.strip()

                if 'timestamp' in df.columns:
                    ref_date = ds.attrs.get('REFERENCE_DATE_TIME', '19500101000000')
                    origin_date = pd.to_datetime(ref_date, format='%Y%m%d%H%M%S')
                    df['timestamp'] = pd.to_timedelta(df['timestamp'], unit='D') + origin_date

                df = df[df['timestamp'].dt.year >= YEAR_FILTER]
                df = df.dropna(subset=['pressure', 'temperature', 'salinity'])

                if not df.empty:
                    print(f"  -> Found {len(df)} valid rows.")
                    all_clean_dataframes.append(df)
                else:
                    print(f"  -> No valid {YEAR_FILTER}+ data rows found in this file after cleaning.")

        except Exception as e:
            print(f"  -> ERROR processing {filename}: {e}")

    if not all_clean_dataframes:
        print("\n❌ No valid data was ingested from any of the files.")
        return

    final_df = pd.concat(all_clean_dataframes, ignore_index=True)
    print(f"\nTotal valid rows to ingest across all files: {len(final_df)}")

    # --- THIS IS THE FIX ---
    # Define the specific data types for the SQL table using SQLAlchemy types
    sql_types = {
        "platform_id": String,
        "cycle_number": Integer,
        "latitude": Float,
        "longitude": Float,
        "timestamp": DateTime,
        "pressure": Float,
        "temperature": Float,
        "salinity": Float
    }
    
    final_df.to_sql(TABLE_NAME, engine, if_exists='replace', index=False, dtype=sql_types)
    print("✅ Data ingestion complete!")


if __name__ == "__main__":
    ingest_data()