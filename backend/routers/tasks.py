from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime
from database import get_db
from dependencies import get_current_user
import models
import schemas
import json
import math

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def task_to_out(task: models.Task) -> schemas.TaskOut:
    return schemas.TaskOut.from_orm_with_tags(task)


@router.post("", response_model=schemas.TaskOut, status_code=201)
def create_task(
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = models.Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        due_date=task_data.due_date,
        tags=json.dumps(task_data.tags or []),
        created_by=current_user.id,
        assigned_to=task_data.assigned_to,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_out(task)


@router.post("/bulk", response_model=List[schemas.TaskOut], status_code=201)
def bulk_create_tasks(
    bulk_data: schemas.TaskBulkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    created = []
    for task_data in bulk_data.tasks:
        task = models.Task(
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            priority=task_data.priority,
            due_date=task_data.due_date,
            tags=json.dumps(task_data.tags or []),
            created_by=current_user.id,
            assigned_to=task_data.assigned_to,
        )
        db.add(task)
        created.append(task)
    db.commit()
    for t in created:
        db.refresh(t)
    return [task_to_out(t) for t in created]


@router.get("", response_model=schemas.TaskListResponse)
def get_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: Optional[str] = Query("desc"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Task).filter(
        models.Task.deleted_at.is_(None),
        or_(
            models.Task.created_by == current_user.id,
            models.Task.assigned_to == current_user.id,
        )
    )

    if search:
        query = query.filter(
            or_(
                models.Task.title.ilike(f"%{search}%"),
                models.Task.description.ilike(f"%{search}%"),
                models.Task.tags.ilike(f"%{search}%"),
            )
        )
    if status:
        try:
            status_enum = models.TaskStatus(status)
            query = query.filter(models.Task.status == status_enum)
        except ValueError:
            pass
    if priority:
        try:
            priority_enum = models.TaskPriority(priority)
            query = query.filter(models.Task.priority == priority_enum)
        except ValueError:
            pass
    if assigned_to:
        query = query.filter(models.Task.assigned_to == assigned_to)

    # Sorting
    sort_column = getattr(models.Task, sort_by, models.Task.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    total = query.count()
    tasks = query.offset((page - 1) * page_size).limit(page_size).all()

    return schemas.TaskListResponse(
        items=[task_to_out(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
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
    return task_to_out(task)


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    task_data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.deleted_at.is_(None)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.status is not None:
        task.status = task_data.status
    if task_data.priority is not None:
        task.priority = task_data.priority
    if task_data.due_date is not None:
        task.due_date = task_data.due_date
    if task_data.tags is not None:
        task.tags = json.dumps(task_data.tags)
    if task_data.assigned_to is not None:
        task.assigned_to = task_data.assigned_to
    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return task_to_out(task)


@router.delete("/{task_id}", status_code=204)
def delete_task(
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

    task.deleted_at = datetime.utcnow()
    db.commit()
