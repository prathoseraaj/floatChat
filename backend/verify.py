import xarray as xr
import pandas as pd
import numpy as np

ds = xr.open_dataset("1902670_prof.nc")
juld = ds['JULD'].values

if np.issubdtype(juld.dtype, np.number):
    timestamp = pd.to_datetime(juld, origin='1950-01-01', unit='D', errors='coerce')
else:
    timestamp = pd.to_datetime(juld, errors='coerce')

print(timestamp)