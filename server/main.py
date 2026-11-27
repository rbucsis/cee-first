from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import core.auth as security
import core.config as config
import core.database as db
import core.storage as store
from routers import auth, students, contacts, student_contacts, health, groups, team, files

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Container booting: Opening PostgreSQL connection pool...")
    await db.init_db()
    gcs_client, gcs_bucket = store.init_storage()
    app.state.gcs_client = gcs_client
    app.state.gcs_bucket = gcs_bucket
    try:
        yield
    finally:
        print("Shutting down: Closing PostgreSQL connection pool...")
        await db.close_db()
        if app.state.gcs_client:
            app.state.gcs_client.close()

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
app.include_router(groups.router)
app.include_router(team.router)
app.include_router(files.router)