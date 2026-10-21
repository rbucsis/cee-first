from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import AsyncConnection

from core.auth import get_current_user
from core.database import get_db_connection
from schemas.groups import GroupCreate, GroupUpdate, GroupResponse

router = APIRouter(prefix="/api/v1", tags=["Groups"])


@router.post(
    "/centers/{center_id}/groups",
    response_model=GroupResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_group(
    center_id: UUID,
    payload: GroupCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Creates a new group under a specific center."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO cee_dev.groups (
                center_id, 
                name, 
                created_by, 
                updated_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, center_id, name, created_utc, updated_utc, record_status;
            """,
            (
                center_id,
                payload.name,
                user_id_str,
                user_id_str,
            ),
        )
        group = await cur.fetchone()

    return group


@router.get(
    "/centers/{center_id}/groups", response_model=List[GroupResponse]
)
async def list_groups(
    center_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Fetches all active students enrolled at a specific center."""
    async with db.cursor() as cur:
        await cur.execute(
            """
            SELECT id, center_id, name, created_utc, updated_utc, record_status
            FROM cee_dev.groups
            WHERE center_id = %s AND record_status = 'Active'
            ORDER BY name ASC;
            """,
            (center_id,),
        )
        groups = await cur.fetchall()

    return groups


@router.get("/groups/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Fetches a single group by ID."""
    async with db.cursor() as cur:
        await cur.execute(
            """
            SELECT id, center_id, name, created_utc, updated_utc, record_status
            FROM cee_dev.groups
            WHERE id = %s AND record_status = 'Active';
            """,
            (group_id,),
        )
        group = await cur.fetchone()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found."
        )

    return group


@router.put("/groups/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: UUID,
    payload: GroupUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Updates an existing student profile."""
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

    values = list(update_data.values()) + [user_id_str, group_id]

    async with db.cursor() as cur:
        await cur.execute(
            f"""
            UPDATE cee_dev.groups
            SET {sql_set}
            WHERE id = %s AND record_status = 'Active'
            RETURNING id, center_id, name, created_utc, updated_utc, record_status;
            """,
            values,
        )
        updated_group = await cur.fetchone()

    if not updated_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found."
        )

    return updated_group


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Deletes a Student."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute(
            """
            UPDATE cee_dev.groups
            SET record_status = 'Deleted', updated_by = %s
            WHERE id = %s AND record_status = 'Active';
            """,
            (user_id_str, group_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found or already deleted.",
            )