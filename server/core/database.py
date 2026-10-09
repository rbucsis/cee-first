import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

# Break out credentials or encode the raw password
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS") 
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_SCHEMA = os.getenv("DB_SCHEMA")

# Escape the password safely
ENCODED_PASS = quote_plus(DB_PASS)

DATABASE_URL = f"postgresql://{DB_USER}:{ENCODED_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Initialize pool with dict_row so queries return Python dicts instead of tuples
pool = AsyncConnectionPool(
    conninfo=DATABASE_URL,
    open=False,
    min_size=1,
    max_size=5,
    max_idle=300,
    kwargs={"row_factory": dict_row}
)

async def init_db():
    await pool.open()

async def close_db():
    await pool.close()

async def get_db_connection() -> AsyncGenerator:
    async with pool.connection() as conn:
        # Automatically route all queries to the cee_dev schema
        async with conn.cursor() as cur:
            await cur.execute(f"SET search_path TO {DB_SCHEMA}, public;")
        yield conn