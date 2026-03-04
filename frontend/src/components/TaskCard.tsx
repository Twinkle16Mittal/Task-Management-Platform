import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface TaskCardProps {
    task: Task;
    onDelete?: (id: number) => void;
}

function isOverdue(task: Task) {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date() && task.status !== 'done' && task.status !== 'cancelled';
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
    const navigate = useNavigate();
    const overdue = isOverdue(task);

    return (
        <div className="task-card" onClick={() => navigate(`/tasks/${task.id}`)}>
            <div className="task-card-header">
                <h3 className="task-card-title">{task.title}</h3>
            </div>

            {task.description && (
                <p className="task-card-desc">{task.description}</p>
            )}

            <div className="task-card-badges">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {task.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                ))}
                {(task.tags?.length ?? 0) > 3 && (
                    <span className="tag">+{(task.tags?.length ?? 0) - 3}</span>
                )}
            </div>

            <div className="task-card-footer">
                <div className="task-card-meta">
                    {task.due_date && (
                        <span className={overdue ? 'due-date-overdue' : ''} title="Due date">
                            📅 {formatDate(task.due_date)}
                            {overdue && ' ⚠️'}
                        </span>
                    )}
                    {task.comment_count > 0 && (
                        <span title="Comments">💬 {task.comment_count}</span>
                    )}
                    {task.file_count > 0 && (
                        <span title="Files">📎 {task.file_count}</span>
                    )}
                </div>
                {task.assignee && (
                    <div
                        className="avatar"
                        style={{ width: 26, height: 26, fontSize: '0.7rem' }}
                        title={task.assignee.full_name || task.assignee.username}
                    >
                        {(task.assignee.full_name || task.assignee.username).slice(0, 2).toUpperCase()}
                    </div>
                )}
            </div>

            {onDelete && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={e => { e.stopPropagation(); onDelete(task.id); }}
                    >
                        🗑️ Delete
                    </button>
                </div>
            )}
        </div>
    );
}
