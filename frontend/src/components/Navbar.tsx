import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleTheme = () => {
        window.dispatchEvent(new Event('toggle-theme'));
    };

    const initials = user?.full_name
        ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.username?.slice(0, 2).toUpperCase() || '??';

    return (
        <nav className="navbar">
            <span className="navbar-brand">⚡ TaskFlow</span>
            <div className="navbar-spacer" />
            <div className="navbar-actions">
                <button className="navbar-btn btn-ghost" onClick={toggleTheme} title="Toggle theme">
                    🌙
                </button>
                <Link to="/tasks/new">
                    <button className="btn btn-primary btn-sm">+ New Task</button>
                </Link>
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    <div className="avatar" title={user?.full_name || user?.username}>{initials}</div>
                </Link>
                <button className="navbar-btn" onClick={handleLogout} title="Logout">
                    🚪 Logout
                </button>
            </div>
        </nav>
    );
}
