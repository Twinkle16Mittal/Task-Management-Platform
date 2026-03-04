import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import type { Task, TaskFilters } from '../types';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';

const STATUSES = ['', 'todo', 'in_progress', 'done', 'cancelled'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];

function useDebounce<T>(value: T, delay = 400): T {
    const [deb, setDeb] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDeb(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return deb;
}

export default function TaskList() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState<TaskFilters>({
        page: 1, page_size: 12, sort_by: 'created_at', sort_order: 'desc',
    });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [bulkModal, setBulkModal] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkError, setBulkError] = useState('');

    const debouncedSearch = useDebounce(search);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const params: TaskFilters = {
                page: filters.page,
                page_size: filters.page_size,
                sort_by: sortBy,
                sort_order: sortOrder,
            };
            if (debouncedSearch) params.search = debouncedSearch;
            if (statusFilter) params.status = statusFilter;
            if (priorityFilter) params.priority = priorityFilter;

            const res = await tasksApi.getTasks(params);
            setTasks(res.items);
            setTotal(res.total);
            setTotalPages(res.total_pages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filters.page, debouncedSearch, statusFilter, priorityFilter, sortBy, sortOrder]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await tasksApi.deleteTask(deleteId);
            setDeleteId(null);
            fetchTasks();
        } finally {
            setDeleting(false);
        }
    };

    const handleBulkCreate = async () => {
        setBulkError('');
        const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) { setBulkError('Enter at least one task title'); return; }
        setBulkLoading(true);
        try {
            await tasksApi.bulkCreateTasks(lines.map(title => ({ title })));
            setBulkModal(false);
            setBulkText('');
            fetchTasks();
        } catch (e: any) {
            setBulkError(e.response?.data?.detail || 'Failed to create tasks');
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tasks</h1>
                    <p className="page-subtitle">{total} task{total !== 1 ? 's' : ''} total</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={() => setBulkModal(true)}>📋 Bulk Create</button>
                    <Link to="/tasks/new"><button className="btn btn-primary">+ New Task</button></Link>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="search"
                        className="search-input"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
                    />
                </div>
                <select className="filter-select" value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}>
                    <option value="">All Statuses</option>
                    {STATUSES.slice(1).map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                </select>
                <select className="filter-select" value={priorityFilter}
                    onChange={e => { setPriorityFilter(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}>
                    <option value="">All Priorities</option>
                    {PRIORITIES.slice(1).map(p => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                </select>
                <select className="filter-select" value={sortBy}
                    onChange={e => setSortBy(e.target.value)}>
                    <option value="created_at">Created Date</option>
                    <option value="updated_at">Updated Date</option>
                    <option value="due_date">Due Date</option>
                    <option value="title">Title</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                </select>
                <button className="btn btn-ghost btn-sm"
                    onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
                    {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
                </button>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : tasks.length === 0 ? (
                <EmptyState
                    icon="📋"
                    title="No tasks found"
                    description={search || statusFilter || priorityFilter
                        ? 'Try adjusting your filters'
                        : 'Create your first task to get started'}
                    action={<Link to="/tasks/new"><button className="btn btn-primary">+ Create Task</button></Link>}
                />
            ) : (
                <>
                    <div className="task-grid">
                        {tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onDelete={id => setDeleteId(id)}
                            />
                        ))}
                    </div>
                    <Pagination
                        page={filters.page || 1}
                        totalPages={totalPages}
                        onPageChange={p => setFilters(f => ({ ...f, page: p }))}
                    />
                </>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <ConfirmDialog
                    title="Delete Task"
                    message="Are you sure you want to delete this task? This action cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteId(null)}
                    loading={deleting}
                />
            )}

            {/* Bulk Create Modal */}
            {bulkModal && (
                <Modal
                    title="📋 Bulk Create Tasks"
                    onClose={() => setBulkModal(false)}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setBulkModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleBulkCreate} disabled={bulkLoading}>
                                {bulkLoading ? 'Creating...' : 'Create Tasks'}
                            </button>
                        </>
                    }
                >
                    <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
                        Enter one task title per line. All tasks will be created with default settings.
                    </p>
                    {bulkError && <div className="alert alert-error">{bulkError}</div>}
                    <textarea
                        className="bulk-textarea"
                        placeholder={"Design landing page\nFix login bug\nWrite API documentation"}
                        value={bulkText}
                        onChange={e => setBulkText(e.target.value)}
                    />
                </Modal>
            )}
        </div>
    );
}
