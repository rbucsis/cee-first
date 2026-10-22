from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import AsyncConnection
from firebase_admin import auth as firebase_auth
from core.database import get_db_connection
from schemas.onboarding import OnboardRequest

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_account(
    payload: OnboardRequest,
    db: AsyncConnection = Depends(get_db_connection)
):
    # 1. Create Identity User in GCIP / Firebase
    try:
        user_record = firebase_auth.create_user(
            email=payload.email,
            password=payload.password,
            display_name=f"{payload.first_name} {payload.last_name or ''}".strip()
        )
        gcp_sid = user_record.uid
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create identity account: {str(e)}"
        )

    # 2. Populate PostgreSQL (orgs, users, org_users, centers, center_users)
    try:
        async with db.cursor() as cur:
            async with db.transaction():
                # A. Create Org (Using center_name)
                await cur.execute(
                    """
                    INSERT INTO cee_dev.orgs (name, address_1, address_2, city, province, postal_code, email, phone)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (
                        payload.center_name, payload.address_1, payload.address,
                        payload.city, payload.province, payload.postal_code,
                        payload.email, payload.phone
                    )
                )
                org_id = (await cur.fetchone())["id"]

                # B. Create User with GCIP sid
                await cur.execute(
                    """
                    INSERT INTO cee_dev.users (sid, first_name, last_name, email)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (gcp_sid, payload.first_name, payload.last_name, payload.email)
                )
                user_id = (await cur.fetchone())["id"]

                # C. Link User to Org as ADMIN
                await cur.execute(
                    """
                    INSERT INTO cee_dev.org_users (user_id, org_id, org_role)
                    VALUES (%s, %s, 'ADMIN');
                    """,
                    (user_id, org_id)
                )

                # D. Create Primary Center
                await cur.execute(
                    """
                    INSERT INTO cee_dev.centers (org_id, name, address_1, address_2, city, province, postal_code)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (
                        org_id, payload.center_name, payload.address_1,
                        payload.address_2, payload.city,
                        payload.province, payload.postal_code
                    )
                )
                center_id = (await cur.fetchone())["id"]

                # E. Link User to Center
                await cur.execute(
                    """
                    INSERT INTO cee_dev.center_users (user_id, center_id)
                    VALUES (%s, %s);
                    """,
                    (user_id, center_id)
                )

    except Exception as db_error:
        # DB ROLLBACK: Delete GCIP account if database insertion fails
        if gcp_sid:
            firebase_auth.delete_user(gcp_sid)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database setup failed. Registration rolled back: {str(db_error)}"
        )

    return {"status": "ok", "message": "Center and Director account successfully registered."}