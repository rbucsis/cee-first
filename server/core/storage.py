from fastapi import Depends, HTTPException, UploadFile, File, Request
from psycopg import AsyncConnection
from .database import get_db_connection
import os
from dotenv import load_dotenv
from google.cloud import storage
from datetime import timedelta

load_dotenv()

def init_storage() -> tuple[storage.Client | None, storage.Bucket | None]:
    print("Initializing Storage Client...")
    try:
        client = storage.Client.from_service_account_json(
            os.getenv("FILE_SERVICE_ACCOUNT_PATH")
        )
        bucket = client.bucket(os.getenv("GCP_BUCKET_NAME"))
        return client, bucket
    except Exception as e:
        print(f"An error occurred while initializing GCP storage client: {e}")
        return None, None

def get_bucket(request: Request) -> storage.Bucket:
    bucket = getattr(request.app.state, "gcs_bucket", None)
    if bucket is None:
        raise HTTPException(
            status_code=503,
            detail="Cloud Storage is temporarily unavailable."
        )
    return bucket

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
    bucket: storage.Bucket,
) -> None:
    if file.content_type not in FILE_TYPE:
        raise HTTPException(
            status_code=400,
            detail="File type should be one of ['txt', 'pdf', 'doc', 'docx']",
        )

    # No `if not storage_client:` needed anymore — get_bucket() already checked it!
    bucket.blob(path + file.filename).upload_from_file(
        file.file, content_type=file.content_type
    )

async def read_file(file: str, bucket: storage.Bucket) -> str:
    blob = bucket.blob(file)
    if not blob.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="GET",
    )

async def delete_file_from_storage(file: str, bucket: storage.Bucket) -> None:
    blob = bucket.blob(file)
    if blob.exists():
        blob.delete()