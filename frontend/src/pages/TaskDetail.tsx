import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import { commentsApi } from '../api/comments';
import { filesApi } from '../api/files';
import type { Task, Comment, FileAttachment } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUpload from '../components/FileUpload';
import { useAuth } from '../context/AuthContext';

function formatDate(s: string | null) {
    if (!s) return 'Not set';
    return new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function formatDateTime(s: string) {
    return new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TaskDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const taskId = Number(id);

    const [task, setTask] = useState<Task | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [files, setFiles] = useState<FileAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTask, setDeleteTask] = useState(false);
    const [deletingTask, setDeletingTask] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [editCommentId, setEditCommentId] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [deleteFileId, setDeleteFileId] = useState<number | null>(null);

    const loadAll = async () => {
        if (!taskId) return;
        setLoading(true);
        try {
            const [t, c, f] = await Promise.all([
                tasksApi.getTask(taskId),
                commentsApi.getComments(taskId),
                filesApi.getFiles(taskId),
            ]);
            setTask(t);
            setComments(c);
            setFiles(f);
        } catch {
            navigate('/tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, [taskId]);

    const handleDeleteTask = async () => {
        setDeletingTask(true);
        await tasksApi.deleteTask(taskId);
        navigate('/tasks');
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmittingComment(true);
        try {
            const c = await commentsApi.addComment(taskId, { content: newComment });
            setComments(prev => [...prev, c]);
            setNewComment('');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleEditComment = async (commentId: number) => {
        if (!editCommentText.trim()) return;
        const updated = await commentsApi.updateComment(commentId, { content: editCommentText });
        setComments(prev => prev.map(c => c.id === commentId ? updated : c));
        setEditCommentId(null);
    };

    const handleDeleteComment = async () => {
        if (!deleteCommentId) return;
        await commentsApi.deleteComment(deleteCommentId);
        setComments(prev => prev.filter(c => c.id !== deleteCommentId));
        setDeleteCommentId(null);
    };

    const handleUpload = async (fileList: File[]) => {
        setUploadingFiles(true);
        try {
            const uploaded = await filesApi.uploadFiles(taskId, fileList);
            setFiles(prev => [...prev, ...uploaded]);
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleDownload = (fileId: number, name: string) => {
        const url = `${import.meta.env.VITE_API_URL || ''}/api/files/${fileId}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        const token = localStorage.getItem('access_token');
        // Use fetch for download with auth
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = name;
                link.click();
                URL.revokeObjectURL(blobUrl);
            });
    };

    const handleDeleteFile = async () => {
        if (!deleteFileId) return;
        await filesApi.deleteFile(deleteFileId);
        setFiles(prev => prev.filter(f => f.id !== deleteFileId));
        setDeleteFileId(null);
    };

    if (loading) return <LoadingSpinner />;
    if (!task) return null;

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>← Back</button>
                    <h1 className="page-title" style={{ fontSize: '1.375rem' }}>{task.title}</h1>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link to={`/tasks/${taskId}/edit`}>
                        <button className="btn btn-secondary">✏️ Edit</button>
                    </Link>
                    <button className="btn btn-danger" onClick={() => setDeleteTask(true)}>🗑️ Delete</button>
                </div>
            </div>

            <div className="task-detail-grid">
                {/* Main Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Description */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 12 }}>Description</h3>
                        {task.description ? (
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                {task.description}
                            </p>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description</p>
                        )}
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: 12 }}>Tags</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {task.tags.map(tag => (
                                    <span key={tag} className="tag" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* File Attachments */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 12 }}>📎 Files ({files.length})</h3>
                        <FileUpload
                            existingFiles={files}
                            onUpload={handleUpload}
                            onDelete={async (id) => { setDeleteFileId(id); }}
                            onDownload={handleDownload}
                            uploading={uploadingFiles}
                        />
                    </div>

                    {/* Comments */}
                    <div className="card">
                        <h3 className="card-title" style={{ marginBottom: 16 }}>💬 Comments ({comments.length})</h3>
                        <form onSubmit={handleAddComment} style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <textarea
                                className="form-textarea"
                                style={{ flex: 1, minHeight: 72, resize: 'vertical' }}
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                rows={2}
                            />
                            <button type="submit" className="btn btn-primary" disabled={submittingComment || !newComment.trim()}>
                                {submittingComment ? '...' : 'Post'}
                            </button>
                        </form>

                        {comments.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No comments yet. Be the first!</p>
                        ) : (
                            <div>
                                {comments.map(comment => (
                                    <div key={comment.id} className="comment-item">
                                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}>
                                            {(comment.author?.full_name || comment.author?.username || '?').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="comment-body">
                                            <div className="comment-meta">
                                                <span className="comment-author">{comment.author?.full_name || comment.author?.username || 'User'}</span>
                                                <span className="comment-time">{formatDateTime(comment.created_at)}</span>
                                            </div>
                                            {editCommentId === comment.id ? (
                                                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                                                    <textarea
                                                        className="form-textarea"
                                                        value={editCommentText}
                                                        onChange={e => setEditCommentText(e.target.value)}
                                                        rows={3}
                                                        style={{ minHeight: 60 }}
                                                    />
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button className="btn btn-primary btn-sm" onClick={() => handleEditComment(comment.id)}>Save</button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditCommentId(null)}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="comment-content">{comment.content}</p>
                                                    {comment.user_id === user?.id && (
                                                        <div className="comment-actions">
                                                            <button className="btn btn-ghost btn-sm" onClick={() => {
                                                                setEditCommentId(comment.id);
                                                                setEditCommentText(comment.content);
                                                            }}>✏️ Edit</button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteCommentId(comment.id)}>🗑️</button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Column — Metadata */}
                <div className="card" style={{ alignSelf: 'start' }}>
                    <h3 className="card-title" style={{ marginBottom: 12 }}>Details</h3>
                    <div>
                        <div className="detail-meta-item">
                            <span className="detail-meta-label">Status</span>
                            <StatusBadge status={task.status} />
                        </div>
                        <div className="detail-meta-item">
                            <span className="detail-meta-label">Priority</span>
                            <PriorityBadge priority={task.priority} />
                        </div>
                        <div className="detail-meta-item">
                            <span className="detail-meta-label">Due Date</span>
                            <span style={{ fontSize: '0.875rem' }}>{formatDate(task.due_date)}</span>
                        </div>
                        <div className="detail-meta-item">
                            <span className="detail-meta-label">Created by</span>
                            <span style={{ fontSize: '0.875rem' }}>
                                {task.creator?.full_name || task.creator?.username || '—'}
                            </span>
                        </div>
                        <div className="detail-meta-item">
                            <span className="detail-meta-label">Assigned to</span>
                            <span style={{ fontSize: '0.875rem' }}>
                                {task.assignee?.full_name || task.assignee?.username || 'Unassigned'}
                            </span>
                        </div>
                        <div className="detail-meta-item">
                            <span className="detail-meta-label">Created</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDateTime(task.created_at)}</span>
                        </div>
                        <div className="detail-meta-item">
                            <span className="detail-meta-label">Updated</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDateTime(task.updated_at)}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <Link to={`/tasks/${taskId}/edit`} style={{ display: 'block', marginBottom: 8 }}>
                            <button className="btn btn-secondary" style={{ width: '100%' }}>✏️ Edit Task</button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Confirm Dialogs */}
            {deleteTask && (
                <ConfirmDialog
                    title="Delete Task"
                    message="Are you sure you want to delete this task? All comments and files will be removed."
                    confirmLabel="Delete Task"
                    onConfirm={handleDeleteTask}
                    onCancel={() => setDeleteTask(false)}
                    loading={deletingTask}
                />
            )}
            {deleteCommentId && (
                <ConfirmDialog
                    title="Delete Comment"
                    message="Are you sure you want to delete this comment?"
                    confirmLabel="Delete"
                    onConfirm={handleDeleteComment}
                    onCancel={() => setDeleteCommentId(null)}
                />
            )}
            {deleteFileId && (
                <ConfirmDialog
                    title="Delete File"
                    message="Are you sure you want to delete this file?"
                    confirmLabel="Delete"
                    onConfirm={handleDeleteFile}
                    onCancel={() => setDeleteFileId(null)}
                />
            )}
        </div>
    );
}
