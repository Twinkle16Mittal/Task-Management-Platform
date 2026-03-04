import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
    danger?: boolean;
}

export default function ConfirmDialog({
    title,
    message,
    confirmLabel = 'Confirm',
    onConfirm,
    onCancel,
    loading,
    danger = true,
}: ConfirmDialogProps) {
    return (
        <Modal
            title={title}
            onClose={onCancel}
            maxWidth={400}
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmLabel}
                    </button>
                </>
            }
        >
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </Modal>
    );
}
