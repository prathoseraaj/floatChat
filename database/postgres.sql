--QUERY TO SELECT THE DATA IN THE TABLE
SELECT * FROM argo_profiles;

--QUERY TO REMOVE THE NULL VALUES FROM THE TABLE
 DELETE FROM argo_profiles WHERE pressure is NULL AND temperature is NULL AND salinity is NULL;

 --CPOY THE POSTGRES TABLE INTO CSV
 COPY argo_profiles TO '/tmp/argo_profiles.csv' DELIMITER ',' CSV HEADER;
