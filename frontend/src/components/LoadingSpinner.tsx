import React from 'react';

interface LoadingSpinnerProps {
    fullPage?: boolean;
}

export default function LoadingSpinner({ fullPage }: LoadingSpinnerProps) {
    if (fullPage) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-base)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="spinner-container">
            <div className="spinner" />
        </div>
    );
}
