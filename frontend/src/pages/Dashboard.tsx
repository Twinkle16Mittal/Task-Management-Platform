import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { analyticsApi } from '../api/analytics';
import type { OverviewStats } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_COLORS: Record<string, string> = {
    todo: '#64748b', in_progress: '#f59e0b', done: '#10b981', cancelled: '#ef4444',
};
const PRIORITY_COLORS: Record<string, string> = {
    low: '#22c55e', medium: '#3b82f6', high: '#f97316', urgent: '#ef4444',
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function Dashboard() {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        analyticsApi.getOverview()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;

    const statusData = stats?.by_status.map(s => ({
        name: s.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: s.count,
        color: STATUS_COLORS[s.status] || '#888',
    })) || [];

    const priorityData = stats?.by_priority.map(p => ({
        name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
        count: p.count,
        color: PRIORITY_COLORS[p.priority] || '#888',
    })) || [];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Your task management overview</p>
                </div>
                <Link to="/tasks/new">
                    <button className="btn btn-primary">+ New Task</button>
                </Link>
            </div>

            <div className="stats-grid">
                <div className="stat-card purple">
                    <div className="stat-value">{stats?.total_tasks ?? 0}</div>
                    <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-value">{stats?.overdue_tasks ?? 0}</div>
                    <div className="stat-label">Overdue</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-value">{stats?.tasks_due_today ?? 0}</div>
                    <div className="stat-label">Due Today</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-value">{stats?.completed_this_week ?? 0}</div>
                    <div className="stat-label">Done This Week</div>
                </div>
                <div className="stat-card cyan">
                    <div className="stat-value">
                        {stats?.by_status.find(s => s.status === 'in_progress')?.count ?? 0}
                    </div>
                    <div className="stat-label">In Progress</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3 className="chart-title">Tasks by Status</h3>
                    {statusData.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No tasks yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="value"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                >
                                    {statusData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">Tasks by Priority</h3>
                    {priorityData.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No tasks yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={priorityData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {priorityData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Quick Actions</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link to="/tasks"><button className="btn btn-secondary">📋 View All Tasks</button></Link>
                    <Link to="/tasks/new"><button className="btn btn-primary">+ Create Task</button></Link>
                    <Link to="/analytics"><button className="btn btn-secondary">📊 View Analytics</button></Link>
                </div>
            </div>
        </div>
    );
}
