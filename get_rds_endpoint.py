import boto3
import json

try:
    rds = boto3.client('rds', region_name='ap-south-1')
    response = rds.describe_db_instances(DBInstanceIdentifier='digifort-demo-db')
    endpoint = response['DBInstances'][0]['Endpoint']['Address']
    print(f"ENDPOINT: {endpoint}")
except Exception as e:
    print(f"ERROR: {e}")
