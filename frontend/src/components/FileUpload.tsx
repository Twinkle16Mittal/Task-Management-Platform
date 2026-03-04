import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileAttachment } from '../types';

const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadProps {
    existingFiles?: FileAttachment[];
    onUpload: (files: File[]) => Promise<void>;
    onDelete?: (fileId: number) => Promise<void>;
    onDownload?: (fileId: number, name: string) => void;
    uploading?: boolean;
}

export default function FileUpload({
    existingFiles = [],
    onUpload,
    onDelete,
    onDownload,
    uploading,
}: FileUploadProps) {
    const onDrop = useCallback(async (accepted: File[]) => {
        if (accepted.length > 0) await onUpload(accepted);
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: Object.fromEntries(ALLOWED_TYPES.map(t => [t, []])),
        maxSize: MAX_SIZE,
        disabled: uploading,
    });

    return (
        <div>
            <div {...getRootProps()} className={`dropzone${isDragActive ? ' active' : ''}`}>
                <input {...getInputProps()} />
                <div className="dropzone-icon">📁</div>
                <p className="dropzone-text">
                    {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse'}
                </p>
                <p className="dropzone-hint">PDF, images, Word, Excel, ZIP — max 10MB each</p>
                {uploading && <p style={{ color: 'var(--color-primary)', marginTop: 8 }}>Uploading…</p>}
            </div>

            {existingFiles.length > 0 && (
                <div className="file-list">
                    {existingFiles.map(file => (
                        <div key={file.id} className="file-item">
                            <span style={{ fontSize: '1.1rem' }}>
                                {file.content_type?.startsWith('image') ? '🖼️' :
                                    file.content_type === 'application/pdf' ? '📄' :
                                        file.content_type?.includes('word') ? '📝' :
                                            file.content_type?.includes('excel') ||
                                                file.content_type?.includes('spreadsheet') ? '📊' :
                                                file.content_type === 'application/zip' ? '🗜️' : '📎'}
                            </span>
                            <span className="file-name">{file.original_name}</span>
                            <span className="file-size">{formatBytes(file.file_size)}</span>
                            {onDownload && (
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => onDownload(file.id, file.original_name)}
                                    title="Download"
                                >
                                    ⬇️
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => onDelete(file.id)}
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
