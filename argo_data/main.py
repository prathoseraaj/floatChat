import os
from ftplib import FTP

FTP_HOST = "ftp.ifremer.fr"
FTP_PATH = "/ifremer/argo/dac/coriolis/6901867/profiles/"
LOCAL_DIR = "./argo_data/" 

os.makedirs(LOCAL_DIR, exist_ok=True)

try:
    ftp = FTP(FTP_HOST)
    ftp.login() # Login anonymously
    print(f"Connected to {FTP_HOST}")

    ftp.cwd(FTP_PATH)
    print(f"Changed directory to {FTP_PATH}")
    
    files = ftp.nlst()
    
    nc_files = [f for f in files if f.endswith('.nc') and (f.startswith('R') or f.startswith('D'))]

    print(f"Found {len(nc_files)} profile files. Downloading a few...")

    for filename in nc_files[:5]:
        local_filepath = os.path.join(LOCAL_DIR, filename)
        with open(local_filepath, 'wb') as f:
            ftp.retrbinary(f"RETR {filename}", f.write)
        print(f"Downloaded: {filename}")
        
    ftp.quit()
    print("\nDownload complete!")

except Exception as e:
    print(f"An error occurred: {e}")