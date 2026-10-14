from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import AsyncConnection

from core.auth import get_current_user
from core.database import get_db_connection
from schemas.student_contacts import (
    StudentContactLinkCreate,
    StudentContactLinkResponse,
    StudentContactLinkUpdate,
)

router = APIRouter(prefix="/api/v1/student-contacts", tags=["Student Contacts"])


@router.post(
    "",
    response_model=StudentContactLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_student_contact_link(
    payload: StudentContactLinkCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Creates a link connecting a student to a contact."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        # Prevent duplicate link insertion
        await cur.execute(
            """
            SELECT id FROM cee_dev.student_contacts
            WHERE student_id = %s AND contact_id = %s AND record_status = 'Active';
            """,
            (payload.student_id, payload.contact_id),
        )
        if await cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This contact is already linked to the student.",
            )

        await cur.execute(
            """
            INSERT INTO cee_dev.student_contacts (
                student_id,
                contact_id,
                primary_contact,
                emergency_contact,
                relation,
                user_id,
                created_by,
                updated_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (
                payload.student_id,
                payload.contact_id,
                payload.primary_contact,
                payload.emergency_contact,
                payload.relation,
                payload.user_id,
                user_id_str,
                user_id_str,
            ),
        )
        link_id = (await cur.fetchone())["id"]

        # Fetch complete link record with joined names for the UI response
        await cur.execute(
            """
            SELECT 
                sc.id, sc.student_id, sc.contact_id, sc.primary_contact, sc.emergency_contact, 
                sc.relation, sc.user_id, sc.created_utc, sc.updated_utc, sc.record_status,
                s.first_name AS student_first_name, s.last_name AS student_last_name,
                c.first_name AS contact_first_name, c.last_name AS contact_last_name,
                c.email AS contact_email, c.phone AS contact_phone
            FROM cee_dev.student_contacts sc
            JOIN cee_dev.students s ON sc.student_id = s.id
            JOIN cee_dev.contacts c ON sc.contact_id = c.id
            WHERE sc.id = %s;
            """,
            (link_id,),
        )
        link = await cur.fetchone()

    return link


@router.get("", response_model=List[StudentContactLinkResponse])
async def list_student_contact_links(
    student_id: Optional[UUID] = None,
    contact_id: Optional[UUID] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """
    Fetches student-contact links. 
    Must pass either ?student_id=... OR ?contact_id=...
    """
    if not student_id and not contact_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either student_id or contact_id as a query parameter.",
        )

    query = """
        SELECT 
            sc.id, sc.student_id, sc.contact_id, sc.primary_contact, sc.emergency_contact, 
            sc.relation, sc.user_id, sc.created_utc, sc.updated_utc, sc.record_status,
            s.first_name AS student_first_name, s.last_name AS student_last_name,
            c.first_name AS contact_first_name, c.last_name AS contact_last_name,
            c.email AS contact_email, c.phone AS contact_phone
        FROM cee_dev.student_contacts sc
        JOIN cee_dev.students s ON sc.student_id = s.id
        JOIN cee_dev.contacts c ON sc.contact_id = c.id
        WHERE sc.record_status = 'Active'
    """
    params = []

    if student_id:
        query += " AND sc.student_id = %s"
        params.append(student_id)
    if contact_id:
        query += " AND sc.contact_id = %s"
        params.append(contact_id)

    query += " ORDER BY sc.primary_contact DESC, c.first_name ASC;"

    async with db.cursor() as cur:
        await cur.execute(query, params)
        links = await cur.fetchall()

    return links


@router.put("/{link_id}", response_model=StudentContactLinkResponse)
async def update_student_contact_link(
    link_id: UUID,
    payload: StudentContactLinkUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Updates link metadata (e.g., toggling primary contact status or relationship)."""
    user_id_str = str(current_user["id"])
    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update.",
        )

    set_clauses = [f"{key} = %s" for key in update_data.keys()]
    set_clauses.append("updated_by = %s")
    sql_set = ", ".join(set_clauses)

    values = list(update_data.values()) + [user_id_str, link_id]

    async with db.cursor() as cur:
        await cur.execute(
            f"""
            UPDATE cee_dev.student_contacts
            SET {sql_set}
            WHERE id = %s AND record_status = 'Active';
            """,
            values,
        )
        if cur.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Link record not found.",
            )

        # Re-fetch updated record with joined context
        await cur.execute(
            """
            SELECT 
                sc.id, sc.student_id, sc.contact_id, sc.primary_contact, sc.emergency_contact, 
                sc.relation, sc.user_id, sc.created_utc, sc.updated_utc, sc.record_status,
                s.first_name AS student_first_name, s.last_name AS student_last_name,
                c.first_name AS contact_first_name, c.last_name AS contact_last_name,
                c.email AS contact_email, c.phone AS contact_phone
            FROM cee_dev.student_contacts sc
            JOIN cee_dev.students s ON sc.student_id = s.id
            JOIN cee_dev.contacts c ON sc.contact_id = c.id
            WHERE sc.id = %s;
            """,
            (link_id,),
        )
        updated_link = await cur.fetchone()

    return updated_link


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student_contact_link(
    link_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Soft deletes a student-contact relationship link."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute(
            """
            UPDATE cee_dev.student_contacts
            SET record_status = 'Inactive', updated_by = %s
            WHERE id = %s AND record_status = 'Active';
            """,
            (user_id_str, link_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Link record not found or already deleted.",
            )