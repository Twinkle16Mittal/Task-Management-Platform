from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from dependencies import get_current_user
import models
import schemas

router = APIRouter(tags=["Comments"])


@router.post("/api/tasks/{task_id}/comments", response_model=schemas.CommentOut, status_code=201)
def add_comment(
    task_id: int,
    comment_data: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.deleted_at.is_(None)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comment = models.Comment(
        task_id=task_id,
        user_id=current_user.id,
        content=comment_data.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.get("/api/tasks/{task_id}/comments", response_model=list[schemas.CommentOut])
def get_comments(
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

    comments = db.query(models.Comment).filter(
        models.Comment.task_id == task_id,
        models.Comment.deleted_at.is_(None)
    ).order_by(models.Comment.created_at.asc()).all()
    return comments


@router.put("/api/comments/{comment_id}", response_model=schemas.CommentOut)
def update_comment(
    comment_id: int,
    comment_data: schemas.CommentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id,
        models.Comment.deleted_at.is_(None)
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this comment")

    comment.content = comment_data.content
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/api/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id,
        models.Comment.deleted_at.is_(None)
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    comment.deleted_at = datetime.utcnow()
    db.commit()
