import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [form, setForm] = useState({
        email: '', username: '', password: '', full_name: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.email) e.email = 'Email is required';
        if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters';
        if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
        return e;
    };

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setApiError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/');
        } catch (err: any) {
            setApiError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">⚡ TaskFlow</div>
                <p className="auth-subtitle">Task Management Platform</p>
                <h1 className="auth-title">Create account</h1>

                {apiError && <div className="auth-error">{apiError}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input type="text" className="form-input" placeholder="Jane Doe"
                            value={form.full_name} onChange={set('full_name')} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Username *</label>
                            <input type="text" className="form-input" placeholder="janedoe"
                                value={form.username} onChange={set('username')} />
                            {errors.username && <span className="form-error">{errors.username}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input type="email" className="form-input" placeholder="jane@example.com"
                                value={form.email} onChange={set('email')} />
                            {errors.email && <span className="form-error">{errors.email}</span>}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <input type="password" className="form-input" placeholder="Min. 6 characters"
                            value={form.password} onChange={set('password')} />
                        {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}
                        style={{ marginTop: 8, width: '100%', padding: '12px' }}>
                        {loading ? 'Creating account…' : '✨ Create Account'}
                    </button>
                </form>

                <div className="auth-footer-link">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
