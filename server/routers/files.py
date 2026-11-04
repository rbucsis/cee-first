from typing import List, Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, Form, File
from psycopg import AsyncConnection
from core.auth import get_current_user
from core.database import get_db_connection
from schemas.files import FileResponse, FileRename
from core.storage import write_file

router = APIRouter(prefix="/api/v1", tags=["Files"])

@router.post(
    "/centers/{center_id}/files",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_file(
    center_id: UUID,
    file: Annotated[UploadFile, File()],
    ref_table: Annotated[str, Form()] = None,
    ref_id: Annotated[str, Form()] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Uploads a file for the current center"""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute("""
            SELECT * FROM cee_dev.centers WHERE id = %s AND record_status = 'Active';
        """, (center_id,))

        center = (await cur.fetchone())

        if not center:
            raise HTTPException(status_code=404, detail="Center not found")

        path = f'{center['org_id']}/{center_id}/'
        if ref_table:
            path += f'{ref_table}/'
        if ref_id:
            path += f'{ref_id}/'
            
        await write_file(file=file, path=path)

        await cur.execute(
            """
            INSERT INTO cee_dev.files (
                center_id, 
                ref_table, 
                ref_id, 
                file_name, 
                file_type, 
                created_by, 
                updated_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, center_id, ref_table, ref_id, file_name, file_type, created_utc, updated_utc, record_status;
            """,
            (
                center_id,
                ref_table,
                ref_id,
                file_name,
                file_type,
                user_id_str,
                user_id_str,
            ),
        )
        file_res = await cur.fetchone()

    return file_res


@router.get(
    "/centers/{center_id}/files", response_model=List[FileResponse]
)
async def list_files(
    center_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Lists all active files for a given center."""
    async with db.cursor() as cur:
        await cur.execute(
            """
            SELECT id, center_id, ref_table, ref_id, file_name, file_type, created_utc, updated_utc, record_status
            FROM cee_dev.files
            WHERE center_id = %s AND record_status = 'Active'
            ORDER BY file_name ASC;
            """,
            (center_id,),
        )
        files = await cur.fetchall()

    return files


@router.get("/files/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Fetches a specific file by ID."""
    async with db.cursor() as cur:
        await cur.execute(
            """
            SELECT id, center_id, ref_table, ref_id, file_name, file_type, created_utc, updated_utc, record_status
            FROM cee_dev.files
            WHERE id = %s AND record_status = 'Active';
            """,
            (file_id,),
        )
        file = await cur.fetchone()

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )

    return file


@router.put("/files/{file_id}", response_model=FileResponse)
async def update_file(
    file_id: UUID,
    payload: FileRename,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Updates file details."""
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

    values = list(update_data.values()) + [user_id_str, file_id]

    async with db.cursor() as cur:
        await cur.execute(
            f"""
            UPDATE cee_dev.file
            SET {sql_set}
            WHERE id = %s AND record_status = 'Active'
            RETURNING id, center_id, ref_table, ref_id, file_name, file_type, created_utc, updated_utc, record_status;
            """,
            values,
        )
        updated_file = await cur.fetchone()

    if not updated_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found."
        )

    return updated_file


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db_connection),
):
    """Soft deletes a file."""
    user_id_str = str(current_user["id"])

    async with db.cursor() as cur:
        await cur.execute(
            """
            UPDATE cee_dev.files
            SET record_status = 'Deleted', updated_by = %s
            WHERE id = %s AND record_status = 'Active';
            """,
            (user_id_str, file_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or already deleted.",
            )