import React from 'react';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-icon">{icon}</div>
            <h3 className="empty-title">{title}</h3>
            {description && <p className="empty-desc">{description}</p>}
            {action}
        </div>
    );
}
