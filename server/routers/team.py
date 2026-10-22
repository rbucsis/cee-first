from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import AsyncConnection
from firebase_admin import auth as firebase_auth

from core.auth import get_current_user  # Your auth dependency
from core.database import get_db_connection
from schemas.team import TeamMemberCreate, TeamMemberUpdate, TeamMemberResponse

router = APIRouter(prefix="/api/v1", tags=["Team"])


@router.post(
    "/centers/{center_id}/team",
    response_model=TeamMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_team_member(
    center_id: UUID,
    payload: TeamMemberCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Creates a new team member under a specific center."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute("""
        SELECT org_id FROM cee_dev.centers WHERE id = %s
        """, (center_id,))

        org_id = cur.fetchone['org_id']
        ## Check if the user exists first
        await cur.execute(
            """
            SELECT * FROM cee_dev.users WHERE email = %s AND record_status = 'Active';
            """,
            (
                payload.email,
            ),
        )
        user = await cur.fetchone()
        if not user:
            try:
                user_record = firebase_auth.create_user(
                    email=payload.email,
                    password='asdf1234!', ## obviously this can't stay, need to generate a random password.
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

            try:
                async with db.transaction():
                    await cur.execute(
                        """
                        INSERT INTO cee_dev.users (sid, first_name, last_name, email)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id;
                        """,
                        (gcp_sid, payload.first_name, payload.last_name, payload.email)
                    )
                    user = await cur.fetchone()
                    user_id = user['id']

                    await cur.execute("""
                        SELECT * FROM cee_dev.org_users WHERE org_id = %s AND user_id = %s
                    """, (
                        org_id,
                        user_id
                    ))
                    org_user = await cur.fetchone()
                    if not org_user:
                        await cur.execute(
                            """
                            INSERT INTO cee_dev.org_users (user_id, org_id, org_role)
                            VALUES (%s, %s, 'USER');
                            """,
                            (user_id, org_id)
                        )
            
            except Exception as db_error:
                # DB ROLLBACK: Delete GCIP account if database insertion fails
                if gcp_sid:
                    firebase_auth.delete_user(gcp_sid)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"User Invite Failed. Registration rolled back: {str(db_error)}"
                )

        await cur.execute("""
        SELECT * FROM cee_dev.center_users WHERE center_id = %s AND user_id = %s
        """, (
            center_id,
            user['id']
        ))
        center_user = await cur.fetchone()
        if center_user:
            raise HTTPException(status_code=400, detail="User already belongs to this center's team.")
        
        await cur.execute("""
        INSERT INTO cee_dev.center_users (user_id, center_id, user_role, record_status, created_by, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            user['id'],
            center_id,
            payload.role,
            'Invited',
            user_id_str,
            user_id_str
        ))

        team_member_id = (await cur.fetchone())['id']

        await cur.execute("""
        SELECT * FROM cee_dev.team_memebers WHERE id = %s
        """,(
            team_member_id,
        ))

        team_member = await cur.fetchone()

    return team_member


@router.get(
    "/centers/{center_id}/team", response_model=List[TeamMemberResponse]
)
async def list_team(
    center_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Fetches all active team members at a specific center."""

    async with db.cursor() as cur:
        await cur.execute("""
            SELECT id, center_id, first_name, last_name, email, ece_level, user_role, created_utc, updated_utc, record_status
            FROM cee_dev.team_members
            WHERE center_id = %s AND record_status = 'Active'
            ORDER BY first_name ASC, last_name ASC;
            """,
            (center_id,)
        )
        team = await cur.fetchall()

    return team


@router.get("/team/{team_member_id}", response_model=TeamMemberResponse)
async def get_team_member(
    team_member_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Fetches a team member profile by ID."""
    async with db.cursor() as cur:
        await cur.execute("""
            SELECT id, center_id, first_name, last_name, email, ece_level, user_role, created_utc, updated_utc, record_status
            FROM cee_dev.team_members
            WHERE id = %s AND record_status = 'Active'
            ORDER BY first_name ASC, last_name ASC;
            """,
            (team_member_id,)
        )
        team_member = await cur.fetchone()

    if not team_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Team Member not found."
        )

    return team_member


@router.put("/team/{team_member_id}", response_model=TeamMemberResponse)
async def update_team_member(
    team_member_id: UUID,
    payload: TeamMemberUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Updates an existing team member profile."""
    user_id_str = str(current_user["id"])
    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update.",
        )

    # Build dynamic SET clause
    set_clauses = [f"{key} = %s" for key in update_data.keys()]
    set_clauses.append("updated_by = %s")
    sql_set = ", ".join(set_clauses)

    values = list(update_data.values()) + [user_id_str, team_member_id]

    async with db.cursor() as cur:
        await cur.execute(
            f"""
            UPDATE cee_dev.center_users
            SET {sql_set}
            WHERE id = %s AND record_status = 'Active';
            """,
            values,
        )

        await cur.execute("""
        SELECT id, center_id, first_name, last_name, email, ece_level, user_role, created_utc, update_utc, record_status
        FROM cee_dev.team_members
        WHERE id = %s
        """, (
            team_member_id,
        ))

        updated_student = await cur.fetchone()

    if not updated_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found."
        )

    return updated_student


@router.delete("/team/{team_member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    team_member_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Deletes a Student."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute(
            """
            DELETE FROM cee_dev.center_users
            WHERE id = %s;
            """,
            (team_member_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found or already deleted.",
            )