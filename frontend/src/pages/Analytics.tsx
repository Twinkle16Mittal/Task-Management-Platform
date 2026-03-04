import React, { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend,
} from 'recharts';
import { analyticsApi } from '../api/analytics';
import type { OverviewStats, PerformanceMetric, TrendPoint } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const DAYS_OPTIONS = [
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '1 Year', value: 365 },
];

export default function Analytics() {
    const [days, setDays] = useState(30);
    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [trends, setTrends] = useState<TrendPoint[]>([]);
    const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingTrends, setLoadingTrends] = useState(true);
    const [loadingPerf, setLoadingPerf] = useState(true);

    useEffect(() => {
        analyticsApi.getOverview()
            .then(setOverview)
            .catch(console.error)
            .finally(() => setLoadingOverview(false));
    }, []);

    useEffect(() => {
        setLoadingTrends(true);
        analyticsApi.getTrends(days)
            .then(d => setTrends(d.trends))
            .catch(console.error)
            .finally(() => setLoadingTrends(false));
    }, [days]);

    useEffect(() => {
        analyticsApi.getPerformance()
            .then(setPerformance)
            .catch(console.error)
            .finally(() => setLoadingPerf(false));
    }, []);

    const handleExport = () => {
        const token = localStorage.getItem('access_token');
        const url = `${import.meta.env.VITE_API_URL || ''}/api/analytics/export`;
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'tasks_export.csv';
                a.click();
                URL.revokeObjectURL(a.href);
            });
    };

    // Subset the trend data for clarity if > 60 days
    const chartData = trends.filter((_, i) => {
        if (days <= 30) return true;
        if (days <= 90) return i % 2 === 0;
        return i % 7 === 0;
    }).map(t => ({
        date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Created: t.created,
        Completed: t.completed,
    }));

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Track task trends and team performance</p>
                </div>
                <button className="btn btn-secondary" onClick={handleExport}>
                    📥 Export CSV
                </button>
            </div>

            {/* Overview Stats */}
            {loadingOverview ? (
                <LoadingSpinner />
            ) : overview && (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                        {[
                            { label: 'Total Tasks', value: overview.total_tasks, color: 'var(--accent)', icon: '📋' },
                            { label: 'Overdue', value: overview.overdue_tasks, color: '#ef4444', icon: '⚠️' },
                            { label: 'Due Today', value: overview.tasks_due_today, color: '#f59e0b', icon: '📅' },
                            { label: 'Done This Week', value: overview.completed_this_week, color: '#10b981', icon: '✅' },
                        ].map(item => (
                            <div key={item.label} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
                                <div style={{ fontSize: '1.75rem', marginBottom: 4 }}>{item.icon}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: item.color, lineHeight: 1.1 }}>{item.value}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Status & Priority breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        {/* By Status */}
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: 16 }}>By Status</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {overview.by_status.map(s => {
                                    const pct = overview.total_tasks > 0 ? Math.round(s.count / overview.total_tasks * 100) : 0;
                                    const colors: Record<string, string> = { todo: '#6b7280', in_progress: '#f59e0b', done: '#10b981', cancelled: '#ef4444' };
                                    const color = colors[s.status] || 'var(--accent)';
                                    return (
                                        <div key={s.status}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{s.status.replace('_', ' ')}</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.count} ({pct}%)</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* By Priority */}
                        <div className="card">
                            <h3 className="card-title" style={{ marginBottom: 16 }}>By Priority</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {overview.by_priority.map(p => {
                                    const pct = overview.total_tasks > 0 ? Math.round(p.count / overview.total_tasks * 100) : 0;
                                    const colors: Record<string, string> = { low: '#6b7280', medium: '#3b82f6', high: '#f59e0b', urgent: '#ef4444' };
                                    const color = colors[p.priority] || 'var(--accent)';
                                    return (
                                        <div key={p.priority}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{p.priority}</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.count} ({pct}%)</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="chart-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 className="chart-title" style={{ marginBottom: 0 }}>Task Trends</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {DAYS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                className={`btn btn-sm ${days === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setDays(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                {loadingTrends ? (
                    <LoadingSpinner />
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                            <Legend />
                            <Area type="monotone" dataKey="Created" stroke="#7c3aed" strokeWidth={2} fill="url(#colorCreated)" />
                            <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} fill="url(#colorCompleted)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Performance Table */}
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: 16 }}>👥 User Performance</h3>
                {loadingPerf ? (
                    <LoadingSpinner />
                ) : performance.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No user data available</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Assigned</th>
                                    <th>Completed</th>
                                    <th>In Progress</th>
                                    <th>Overdue</th>
                                    <th>Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performance.map(p => (
                                    <tr key={p.user_id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                                                    {(p.full_name || p.username).slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.full_name || p.username}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{p.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{p.total_assigned}</td>
                                        <td style={{ color: '#10b981', fontWeight: 600 }}>{p.completed}</td>
                                        <td style={{ color: '#f59e0b', fontWeight: 600 }}>{p.in_progress}</td>
                                        <td style={{ color: p.overdue > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: p.overdue > 0 ? 600 : 400 }}>
                                            {p.overdue}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="progress-bar" style={{ width: 80 }}>
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${p.completion_rate}%` }}
                                                    />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.completion_rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
