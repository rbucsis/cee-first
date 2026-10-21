from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import AsyncConnection

from core.auth import get_current_user  # Your auth dependency
from core.database import get_db_connection
from schemas.students import StudentCreate, StudentResponse, StudentUpdate

router = APIRouter(prefix="/api/v1", tags=["Students"])


@router.post(
    "/centers/{center_id}/students",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_student(
    center_id: UUID,
    payload: StudentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Creates a new student profile under a specific center."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO cee_dev.students (
                center_id, 
                first_name, 
                last_name, 
                birthdate, 
                enroll_date,
                group_id,
                created_by, 
                updated_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, center_id, first_name, last_name, birthdate, enroll_date, group_id, created_utc, updated_utc, record_status;
            """,
            (
                center_id,
                payload.first_name,
                payload.last_name,
                payload.birthdate,
                payload.enroll_date,
                payload.group_id,
                user_id_str,
                user_id_str,
            ),
        )
        student = await cur.fetchone()

    return student


@router.get(
    "/centers/{center_id}/students", response_model=List[StudentResponse]
)
async def list_students(
    center_id: UUID,
    group_id: Optional[UUID] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Fetches all active students enrolled at a specific center."""

    query = """
        SELECT id, center_id, first_name, last_name, birthdate, enroll_date, group_id, created_utc, updated_utc, record_status
        FROM cee_dev.students
        WHERE center_id = %s AND record_status = 'Active'
    """

    params = [ center_id, ]

    if group_id:
        query += """
            AND group_id = %s
        """
        params.append(group_id)

    query += """
        ORDER BY first_name ASC, last_name ASC;
    """
    async with db.cursor() as cur:
        await cur.execute(
            """
            SELECT id, center_id, first_name, last_name, birthdate, enroll_date, group_id, created_utc, updated_utc, record_status
            FROM cee_dev.students
            WHERE center_id = %s AND record_status = 'Active'
            ORDER BY first_name ASC, last_name ASC;
            """,
            (center_id,),
        )
        students = await cur.fetchall()

    return students


@router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Fetches a single student profile by ID."""
    async with db.cursor() as cur:
        await cur.execute(
            """
            SELECT id, center_id, first_name, last_name, birthdate, enroll_date, group_id, created_utc, updated_utc, record_status
            FROM cee_dev.students
            WHERE id = %s AND record_status = 'Active';
            """,
            (student_id,),
        )
        student = await cur.fetchone()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found."
        )

    return student


@router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: UUID,
    payload: StudentUpdate,
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

    values = list(update_data.values()) + [user_id_str, student_id]

    async with db.cursor() as cur:
        await cur.execute(
            f"""
            UPDATE cee_dev.students
            SET {sql_set}
            WHERE id = %s AND record_status = 'Active'
            RETURNING id, center_id, first_name, last_name, birthdate, enroll_date, group_id, created_utc, updated_utc, record_status;
            """,
            values,
        )
        updated_student = await cur.fetchone()

    if not updated_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found."
        )

    return updated_student


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Deletes a Student."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute(
            """
            UPDATE cee_dev.students
            SET record_status = 'Deleted', updated_by = %s
            WHERE id = %s AND record_status = 'Active';
            """,
            (user_id_str, student_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found or already deleted.",
            )