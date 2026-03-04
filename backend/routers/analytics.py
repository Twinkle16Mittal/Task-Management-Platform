from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
from database import get_db
from dependencies import get_current_user
import models
import schemas
import io
import csv

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview", response_model=schemas.OverviewStats)
def get_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from sqlalchemy import or_
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_start = today_start - timedelta(days=7)

    # Base filter: only this user's tasks
    user_filter = or_(
        models.Task.created_by == current_user.id,
        models.Task.assigned_to == current_user.id,
    )
    base = db.query(models.Task).filter(models.Task.deleted_at.is_(None), user_filter)
    total = base.count()

    by_status_raw = db.query(
        models.Task.status, func.count(models.Task.id)
    ).filter(models.Task.deleted_at.is_(None), user_filter).group_by(models.Task.status).all()
    by_status = [schemas.StatusCount(status=s.value, count=c) for s, c in by_status_raw]

    by_priority_raw = db.query(
        models.Task.priority, func.count(models.Task.id)
    ).filter(models.Task.deleted_at.is_(None), user_filter).group_by(models.Task.priority).all()
    by_priority = [schemas.PriorityCount(priority=p.value, count=c) for p, c in by_priority_raw]

    overdue = base.filter(
        models.Task.due_date < now,
        models.Task.status != models.TaskStatus.done,
        models.Task.status != models.TaskStatus.cancelled,
    ).count()

    due_today = base.filter(
        models.Task.due_date >= today_start,
        models.Task.due_date < today_end,
    ).count()

    completed_week = base.filter(
        models.Task.status == models.TaskStatus.done,
        models.Task.updated_at >= week_start,
    ).count()

    return schemas.OverviewStats(
        total_tasks=total,
        by_status=by_status,
        by_priority=by_priority,
        overdue_tasks=overdue,
        tasks_due_today=due_today,
        completed_this_week=completed_week,
    )


@router.get("/performance", response_model=list[schemas.PerformanceMetric])
def get_performance(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    now = datetime.utcnow()
    users = db.query(models.User).filter(models.User.is_active == True).all()
    metrics = []

    for user in users:
        tasks = db.query(models.Task).filter(
            models.Task.assigned_to == user.id,
            models.Task.deleted_at.is_(None)
        ).all()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == models.TaskStatus.done)
        in_progress = sum(1 for t in tasks if t.status == models.TaskStatus.in_progress)
        overdue = sum(
            1 for t in tasks
            if t.due_date and t.due_date < now and t.status not in (
                models.TaskStatus.done, models.TaskStatus.cancelled
            )
        )
        rate = (completed / total * 100) if total > 0 else 0.0

        metrics.append(schemas.PerformanceMetric(
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            total_assigned=total,
            completed=completed,
            in_progress=in_progress,
            overdue=overdue,
            completion_rate=round(rate, 2),
        ))

    return metrics


@router.get("/trends", response_model=schemas.TrendData)
def get_trends(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    trends = []

    for i in range(days):
        day_start = start_date + timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        created_count = db.query(models.Task).filter(
            models.Task.created_at >= day_start,
            models.Task.created_at < day_end,
            models.Task.deleted_at.is_(None),
        ).count()

        completed_count = db.query(models.Task).filter(
            models.Task.status == models.TaskStatus.done,
            models.Task.updated_at >= day_start,
            models.Task.updated_at < day_end,
            models.Task.deleted_at.is_(None),
        ).count()

        trends.append(schemas.TrendPoint(
            date=day_start.strftime("%Y-%m-%d"),
            created=created_count,
            completed=completed_count,
        ))

    return schemas.TrendData(trends=trends)


@router.get("/export")
def export_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tasks = db.query(models.Task).filter(models.Task.deleted_at.is_(None)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Status", "Priority", "Due Date", "Tags", "Created By", "Assigned To", "Created At"])

    for task in tasks:
        writer.writerow([
            task.id,
            task.title,
            task.status.value,
            task.priority.value,
            task.due_date.strftime("%Y-%m-%d") if task.due_date else "",
            task.tags or "",
            task.creator.username if task.creator else "",
            task.assignee.username if task.assignee else "",
            task.created_at.strftime("%Y-%m-%d %H:%M"),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tasks_export.csv"},
    )
