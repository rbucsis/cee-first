from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import AsyncConnection

from core.auth import get_current_user
from core.database import get_db_connection
from schemas.contacts import ContactCreate, ContactResponse, ContactUpdate

router = APIRouter(prefix="/api/v1", tags=["Contacts"])

@router.post(
    "/centers/{center_id}/contacts",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_contact(
    center_id: UUID,
    payload: ContactCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Creates a new contact record (parent/guardian/emergency contact) under a center."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO cee_dev.contacts (
                center_id, 
                first_name, 
                last_name, 
                email, 
                phone, 
                created_by, 
                updated_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, center_id, first_name, last_name, email, phone, created_utc, updated_utc, record_status;
            """,
            (
                center_id,
                payload.first_name,
                payload.last_name,
                payload.email,
                payload.phone,
                user_id_str,
                user_id_str,
            ),
        )
        contact = await cur.fetchone()

    return contact


@router.get(
    "/centers/{center_id}/contacts", response_model=List[ContactResponse]
)
async def list_contacts(
    center_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Lists all active contacts for a given center."""
    async with db.cursor() as cur:
        await cur.execute(
            """
            SELECT id, center_id, first_name, last_name, email, phone, created_utc, updated_utc, record_status
            FROM cee_dev.contacts
            WHERE center_id = %s AND record_status = 'Active'
            ORDER BY first_name ASC, last_name ASC;
            """,
            (center_id,),
        )
        contacts = await cur.fetchall()

    return contacts


@router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Fetches a specific contact record by ID."""
    async with db.cursor() as cur:

        try:
            contact_id = UUID(contact_id)
        except:
            raise HTTPException(422, "Contact not found.")
        
        await cur.execute(
            """
            SELECT id, center_id, first_name, last_name, email, phone, created_utc, updated_utc, record_status
            FROM cee_dev.contacts
            WHERE id = %s AND record_status = 'Active';
            """,
            (contact_id,),
        )
        contact = await cur.fetchone()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found."
        )

    return contact


@router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: UUID,
    payload: ContactUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Updates contact details."""
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

    values = list(update_data.values()) + [user_id_str, contact_id]

    async with db.cursor() as cur:
        await cur.execute(
            f"""
            UPDATE cee_dev.contacts
            SET {sql_set}
            WHERE id = %s AND record_status = 'Active'
            RETURNING id, center_id, first_name, last_name, email, phone, created_utc, updated_utc, record_status;
            """,
            values,
        )
        updated_contact = await cur.fetchone()

    if not updated_contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found."
        )

    return updated_contact


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Soft deletes a contact."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute(
            """
            UPDATE cee_dev.contacts
            SET record_status = 'Deleted', updated_by = %s
            WHERE id = %s AND record_status = 'Active';
            """,
            (user_id_str, contact_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found or already deleted.",
            )