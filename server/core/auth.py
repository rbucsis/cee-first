from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth
import firebase_admin
from psycopg import AsyncConnection
from .database import get_db_connection
import os
from dotenv import load_dotenv
import requests
from jwt.algorithms import RSAAlgorithm

load_dotenv()

JWKS_URL = f"https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
google_public_keys = {}

if not firebase_admin._apps:
    print('Initializing Firebase')
    cred = firebase_admin.credentials.Certificate(os.getenv('SERVICE_ACCOUNT_JSON_PATH'))
    firebase_admin.initialize_app(cred)

SECRET = os.getenv('SECRET')
security = HTTPBearer()

async def get_current_user(
    # credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncConnection = Depends(get_db_connection)
) -> dict:

    #TEMPORARY BYPASS
    return {
        "id": "1f1a0875-63ea-4505-9801-d49cd0a63372",
        "email": "rbucsis@bucsisdigital.ca",
        "role": "ADMIN"
    }

    token = credentials.credentials
    
    try:
        # Verify the GCP Identity Platform / Firebase JWT token
        decoded_token = firebase_auth.verify_id_token(token)
        gcp_sid = decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}"
        )

    # Fetch user from cee_dev schema
    async with db.cursor() as cur:
        await cur.execute(
            """
            SELECT id, sid, first_name, last_name, email, record_status 
            FROM cee_dev.users 
            WHERE sid = %s AND record_status = 'Active'
            """,
            (gcp_sid,)
        )
        user = await cur.fetchone()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found. Please complete onboarding."
        )

    return user

def get_google_public_keys():
    global google_public_keys
    if not google_public_keys:
        print('Fetching Keys')
        res = requests.get(JWKS_URL)
        jwks = res.json()
        # Convert Google's JWK set to RSA public keys
        for key in jwks["keys"]:
            google_public_keys[key["kid"]] = RSAAlgorithm.from_jwk(key)
    return google_public_keys