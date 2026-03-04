import React from 'react';
import type { TaskStatus, TaskPriority } from '../types';

const STATUS_LABELS: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    cancelled: 'Cancelled',
};

const PRIORITY_LABELS: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

interface StatusBadgeProps {
    status: TaskStatus;
}

interface PriorityBadgeProps {
    priority: TaskPriority;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <span className={`badge badge-${status}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
    return (
        <span className={`badge badge-${priority}`}>
            {PRIORITY_LABELS[priority] || priority}
        </span>
    );
}
