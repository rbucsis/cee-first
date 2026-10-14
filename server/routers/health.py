import time
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from psycopg import AsyncConnection
from core.database import get_db_connection
from core.auth import get_google_public_keys

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
async def health_check(db: AsyncConnection = Depends(get_db_connection)):
    services = {}
    overall_healthy = True

    # 1. Database Check
    db_start = time.perf_counter()
    try:
        async with db.cursor() as cur:
            await cur.execute("SELECT 1;")
            await cur.fetchone()
        db_latency_ms = round((time.perf_counter() - db_start) * 1000, 2)
        services["database"] = {
            "status": "operational",
            "latency_ms": db_latency_ms
        }
    except Exception as e:
        overall_healthy = False
        services["database"] = {
            "status": "outage",
            "error": str(e)
        }

    # 2. GCIP / Identity Platform Check
    auth_start = time.perf_counter()
    try:
        keys = get_google_public_keys()
        auth_latency_ms = round((time.perf_counter() - auth_start) * 1000, 2)
        services["identity_platform"] = {
            "status": "operational",
            "keys_cached": len(keys),
            "latency_ms": auth_latency_ms
        }
    except Exception as e:
        overall_healthy = False
        services["identity_platform"] = {
            "status": "degraded",
            "error": str(e)
        }

    # Summary Payload for UI Status Page
    payload = {
        "status": "healthy" if overall_healthy else "unhealthy",
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "services": services
    }

    status_code = status.HTTP_200_OK if overall_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(content=payload, status_code=status_code)