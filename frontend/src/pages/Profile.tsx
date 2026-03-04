import React, { useState } from 'react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import type { UserUpdate } from '../types';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState<UserUpdate>({
        full_name: user?.full_name || '',
        username: user?.username || '',
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const set = (k: keyof UserUpdate) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username || form.username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const updated = await authApi.updateProfile(form);
            updateUser(updated);
            setSuccess('Profile updated successfully!');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const initials = (user?.full_name || user?.username || '??')
        .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Manage your account settings</p>
                </div>
            </div>

            <div className="card">
                <div className="profile-header">
                    <div className="profile-avatar">{initials}</div>
                    <div>
                        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{user?.full_name || user?.username}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>@{user?.username}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
                    </div>
                </div>

                <div className="divider" />

                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Edit Profile</h3>

                {success && <div className="alert alert-success">{success}</div>}
                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={user?.email || ''}
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        />
                        <span className="text-sm text-muted">Email cannot be changed</span>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Your full name"
                                value={form.full_name || ''}
                                onChange={set('full_name')}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Username *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="username"
                                value={form.username || ''}
                                onChange={set('username')}
                                minLength={3}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setForm({ full_name: user?.full_name || '', username: user?.username || '' })}
                        >
                            Reset
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Account Info</h3>
                <div>
                    <div className="detail-meta-item">
                        <span className="detail-meta-label">Member Since</span>
                        <span style={{ fontSize: '0.875rem' }}>
                            {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                    </div>
                    <div className="detail-meta-item">
                        <span className="detail-meta-label">Account Status</span>
                        <span className={`badge ${user?.is_active ? 'badge-done' : 'badge-cancelled'}`}>
                            {user?.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
