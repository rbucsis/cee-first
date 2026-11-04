from fastapi import Depends, HTTPException, status, UploadFile
from psycopg import AsyncConnection
from .database import get_db_connection
import os
from dotenv import load_dotenv
from google.cloud import storage

load_dotenv()

print("Initializing Storage Client")
bucket = None
try:
    storage_client = storage.Client.from_service_account_json(os.getenv("FILE_SERVICE_ACCOUNT_PATH"))
    bucket = storage_client.bucket(os.getenv("GCP_BUCKET_NAME"))
except Exception as e:
    print("An error occurred while initializing GCP storage client")
    print(e)

SECRET = os.getenv('SECRET')

FILE_TYPE = {
    'text/plain': 'txt',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
}

async def write_file(
    file: UploadFile,
    path: str,
    db: AsyncConnection = Depends(get_db_connection)
) -> dict:
    
    if not file.content_type in FILE_TYPE:
        raise HTTPException(status_code=400, detail="File type should be one of ['txt', 'pdf', 'doc', 'docx']")