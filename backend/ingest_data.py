import os
import pandas as pd
import xarray as xr
import numpy as np
from sqlalchemy import create_engine

DB_URL = "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
DATA_DIRECTORY = "./argo_data/"
TABLE_NAME = "argo_profiles"
YEAR_FILTER = 2024

CORE_COLUMNS = {
    'PLATFORM_NUMBER': 'platform_id',
    'CYCLE_NUMBER': 'cycle_number',
    'LATITUDE': 'latitude',
    'LONGITUDE': 'longitude',
    'JULD': 'timestamp',
    'PRES_ADJUSTED': 'pressure',
    'TEMP_ADJUSTED': 'temperature',
    'PSAL_ADJUSTED': 'salinity'
}

engine = create_engine(DB_URL)

def decode_if_bytes(val):
    if isinstance(val, bytes):
        return val.decode('utf-8').strip()
    return val

def extract_profiles(ds):
    # Determine the number of profiles
    if 'N_PROF' in ds.dims:
        n_prof = ds.dims['N_PROF']
    elif 'N_PROF' in ds.variables:
        n_prof = ds['N_PROF'].values[0]
    else:
        n_prof = 1  # fallback

    records = []
    for prof in range(n_prof):
        try:
            record = {}
            for nc_col, db_col in CORE_COLUMNS.items():
                var = ds[nc_col]
                # 1D variable (per profile)
                if var.ndim == 1:
                    val = var.values[prof]
                # 2D variable (profile x level), take first (surface) level or mean
                elif var.ndim == 2:
                    arr = var.values[prof]
                    # For pressure/temperature/salinity, get arrays (keep as is)
                    if nc_col in ['PRES_ADJUSTED', 'TEMP_ADJUSTED', 'PSAL_ADJUSTED']:
                        val = arr
                    else:
                        val = arr[0] if arr.size else np.nan
                else:
                    val = var.values
                # Decode if bytes
                if isinstance(val, np.ndarray):
                    if val.dtype.type is np.bytes_:
                        val = [decode_if_bytes(v) for v in val]
                elif isinstance(val, bytes):
                    val = decode_if_bytes(val)
                record[db_col] = val
            # JULD handling
            juld = record['timestamp']
            if isinstance(juld, np.ndarray) and juld.size == 1:
                juld = juld[0]
            # Convert timestamp
            if np.issubdtype(type(juld), np.number):
                timestamp = pd.to_datetime(juld, origin='1950-01-01', unit='D', errors='coerce')
            else:
                timestamp = pd.to_datetime(juld, errors='coerce')
            record['timestamp'] = timestamp
            # Only keep profiles in the desired year
            if pd.notnull(timestamp) and getattr(timestamp, 'year', 0) >= YEAR_FILTER:
                records.append(record)
        except Exception as e:
            print(f"Error extracting profile {prof}: {e}")
    return records

def process_nc_file(file_path):
    try:
        with xr.open_dataset(file_path) as ds:
            records = extract_profiles(ds)
            if not records:
                print(f"No {YEAR_FILTER}+ profiles in {file_path}")
                return None
            # Flatten arrays (like pressure/temp/salinity) as mean value for SQL ingest, or customize as needed
            for rec in records:
                for key in ['pressure', 'temperature', 'salinity']:
                    arr = rec[key]
                    if isinstance(arr, np.ndarray):
                        arr = arr[~np.isnan(arr)]
                        rec[key] = float(arr.mean()) if arr.size else np.nan
            df = pd.DataFrame(records)
            df = df.dropna(subset=['timestamp'])  # Ensure valid time
            print(f"Ingesting {len(df)} profiles from {file_path}")
            return df
    except Exception as e:
        print(f"Could not process {file_path}. Error: {type(e).__name__}: {e}")
        return None

def main():
    files = [fname for fname in os.listdir(DATA_DIRECTORY) if fname.endswith("_prof.nc")]
    print(f"Found {len(files)} profile files in {DATA_DIRECTORY}")

    n_total = 0
    for filename in files:
        file_path = os.path.join(DATA_DIRECTORY, filename)
        print(f"Processing {file_path}...")
        df_clean = process_nc_file(file_path)
        if df_clean is not None and not df_clean.empty:
            df_clean.to_sql(TABLE_NAME, engine, if_exists='append', index=False)
            n_total += len(df_clean)
    print(f"Data ingestion complete! Total rows ingested: {n_total}")

if __name__ == "__main__":
    main()