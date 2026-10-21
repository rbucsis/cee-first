from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import core.auth as security
import core.config as config
import core.database as db
from routers import auth, students, contacts, student_contacts, health

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

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Allows Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],          # Allows GET, POST, PUT, DELETE, OPTIONS, etc.
    allow_headers=["*"],          # Allows Authorization, Content-Type, etc.
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(contacts.router)
app.include_router(student_contacts.router)
app.include_router(health.router)