from contextlib import asynccontextmanager
from fastapi import FastAPI
import core.auth as security
import core.config as config
import core.database as db
from routers import auth, students

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

app.include_router(auth.router)
app.include_router(students.router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }