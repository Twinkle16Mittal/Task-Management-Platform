from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from models import TaskStatus, TaskPriority
import json


# ────────────────────── Auth / User ──────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    avatar: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    avatar: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ────────────────────── Tasks ──────────────────────

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.todo
    priority: Optional[TaskPriority] = TaskPriority.medium
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = []
    assigned_to: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[int] = None


class TaskBulkCreate(BaseModel):
    tasks: List[TaskCreate]


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime]
    tags: Optional[List[str]]
    created_by: int
    assigned_to: Optional[int]
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserOut] = None
    assignee: Optional[UserOut] = None
    comment_count: Optional[int] = 0
    file_count: Optional[int] = 0

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_tags(cls, task):
        data = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "tags": json.loads(task.tags) if task.tags else [],
            "created_by": task.created_by,
            "assigned_to": task.assigned_to,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "creator": task.creator,
            "assignee": task.assignee,
            "comment_count": len([c for c in task.comments if c.deleted_at is None]),
            "file_count": len(task.files),
        }
        return cls(**data)


class TaskListResponse(BaseModel):
    items: List[TaskOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ────────────────────── Comments ──────────────────────

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    author: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ────────────────────── Files ──────────────────────

class FileOut(BaseModel):
    id: int
    task_id: int
    uploaded_by: int
    filename: str
    original_name: str
    file_size: int
    content_type: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────────── Analytics ──────────────────────

class StatusCount(BaseModel):
    status: str
    count: int


class PriorityCount(BaseModel):
    priority: str
    count: int


class OverviewStats(BaseModel):
    total_tasks: int
    by_status: List[StatusCount]
    by_priority: List[PriorityCount]
    overdue_tasks: int
    tasks_due_today: int
    completed_this_week: int


class PerformanceMetric(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str]
    total_assigned: int
    completed: int
    in_progress: int
    overdue: int
    completion_rate: float


class TrendPoint(BaseModel):
    date: str
    created: int
    completed: int


class TrendData(BaseModel):
    trends: List[TrendPoint]
