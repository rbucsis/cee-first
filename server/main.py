from contextlib import asynccontextmanager
from fastapi import FastAPI
import core.config as config
import core.database as db

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Container booting: Opening PostgreSQL connection pool...")
    await db.init_db()
    yield
    print("SIGTERM received: Closing PostgreSQL connection pool...")
    await db.close_db()

app = FastAPI(
    title=config.title,
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }