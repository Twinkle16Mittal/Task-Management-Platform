from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
import aiofiles
from database import get_db
from dependencies import get_current_user
import models
import schemas
from dotenv import load_dotenv

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10 MB

ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain", "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
}

router = APIRouter(tags=["Files"])
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/api/tasks/{task_id}/files", response_model=list[schemas.FileOut])
def get_files(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.deleted_at.is_(None)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    files = db.query(models.FileAttachment).filter(
        models.FileAttachment.task_id == task_id
    ).order_by(models.FileAttachment.created_at.asc()).all()
    return files


@router.post("/api/tasks/{task_id}/files", response_model=list[schemas.FileOut], status_code=201)
async def upload_files(
    task_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.deleted_at.is_(None)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    saved = []
    for file in files:
        # Content-type validation
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File type '{file.content_type}' not allowed"
            )
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' exceeds 10MB limit")

        ext = os.path.splitext(file.filename)[1]
        stored_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, stored_name)

        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        attachment = models.FileAttachment(
            task_id=task_id,
            uploaded_by=current_user.id,
            filename=stored_name,
            original_name=file.filename,
            file_size=len(content),
            content_type=file.content_type,
        )
        db.add(attachment)
        saved.append(attachment)

    db.commit()
    for a in saved:
        db.refresh(a)
    return saved


@router.get("/api/files/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    attachment = db.query(models.FileAttachment).filter(models.FileAttachment.id == file_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = os.path.join(UPLOAD_DIR, attachment.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=file_path,
        filename=attachment.original_name,
        media_type=attachment.content_type,
    )


@router.delete("/api/files/{file_id}", status_code=204)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    attachment = db.query(models.FileAttachment).filter(models.FileAttachment.id == file_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="File not found")
    if attachment.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")

    # Delete from disk
    file_path = os.path.join(UPLOAD_DIR, attachment.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(attachment)
    db.commit()
