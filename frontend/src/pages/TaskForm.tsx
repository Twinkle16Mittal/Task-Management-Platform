import React, { useEffect, useState, KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import client from '../api/client';
import type { TaskCreate, TaskStatus, TaskPriority, User } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

interface FormState {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string;
    tags: string[];
    tagInput: string;
    assigned_to: string; // stored as string for select value; converted to number on submit
}

export default function TaskForm() {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const taskId = Number(id);

    const [form, setForm] = useState<FormState>({
        title: '', description: '', status: 'todo', priority: 'medium',
        due_date: '', tags: [], tagInput: '', assigned_to: '',
    });
    const [errors, setErrors] = useState<Partial<FormState>>({});
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState('');
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        client.get<User[]>('/api/auth/users')
            .then(r => setUsers(r.data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!isEdit) return;
        tasksApi.getTask(taskId).then(task => {
            setForm({
                title: task.title || '',
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                due_date: task.due_date ? task.due_date.split('T')[0] : '',
                tags: task.tags || [],
                tagInput: '',
                assigned_to: task.assigned_to ? String(task.assigned_to) : '',
            });
            setLoading(false);
        }).catch(() => navigate('/tasks'));
    }, [isEdit, taskId]);

    const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const addTag = () => {
        const tag = form.tagInput.trim().toLowerCase();
        if (tag && !form.tags.includes(tag)) {
            setForm(f => ({ ...f, tags: [...f.tags, tag], tagInput: '' }));
        } else {
            setForm(f => ({ ...f, tagInput: '' }));
        }
    };

    const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
        if (e.key === 'Backspace' && !form.tagInput && form.tags.length > 0) {
            setForm(f => ({ ...f, tags: f.tags.slice(0, -1) }));
        }
    };

    const removeTag = (tag: string) =>
        setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

    const validate = (): boolean => {
        const e: Partial<FormState> = {};
        if (!form.title.trim()) (e as any).title = 'Title is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        setApiError('');
        const data: TaskCreate = {
            title: form.title.trim(),
            description: form.description || undefined,
            status: form.status,
            priority: form.priority,
            due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
            tags: form.tags,
            assigned_to: form.assigned_to ? Number(form.assigned_to) : undefined,
        };
        try {
            if (isEdit) {
                await tasksApi.updateTask(taskId, data);
                navigate(`/tasks/${taskId}`);
            } else {
                const created = await tasksApi.createTask(data);
                navigate(`/tasks/${created.id}`);
            }
        } catch (err: any) {
            setApiError(err.response?.data?.detail || 'Failed to save task');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{isEdit ? '✏️ Edit Task' : '✨ New Task'}</h1>
                    <p className="page-subtitle">{isEdit ? 'Update task details' : 'Fill in the details to create a task'}</p>
                </div>
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Cancel</button>
            </div>

            {apiError && <div className="alert alert-error">{apiError}</div>}

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Task title..."
                            value={form.title}
                            onChange={set('title')}
                            autoFocus
                            maxLength={500}
                        />
                        {(errors as any).title && <span className="form-error">{(errors as any).title}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Describe the task in detail..."
                            value={form.description}
                            onChange={set('description')}
                            rows={4}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={form.status} onChange={set('status')}>
                                {STATUSES.map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select className="form-select" value={form.priority} onChange={set('priority')}>
                                {PRIORITIES.map(p => (
                                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Due Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.due_date}
                            onChange={set('due_date')}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Assign To</label>
                        <select
                            className="form-select"
                            value={form.assigned_to}
                            onChange={set('assigned_to')}
                        >
                            <option value="">Unassigned</option>
                            {users.map(u => (
                                <option key={u.id} value={String(u.id)}>
                                    {u.full_name ? `${u.full_name} (@${u.username})` : `@${u.username}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div
                            className="tags-container"
                            onClick={() => document.getElementById('tag-input')?.focus()}
                        >
                            {form.tags.map(tag => (
                                <span key={tag} className="tag-item">
                                    {tag}
                                    <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>×</button>
                                </span>
                            ))}
                            <input
                                id="tag-input"
                                className="tag-input"
                                placeholder={form.tags.length === 0 ? 'Add tags (press Enter or comma)' : ''}
                                value={form.tagInput}
                                onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                                onKeyDown={handleTagKey}
                                onBlur={addTag}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : isEdit ? '💾 Save Changes' : '✨ Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
