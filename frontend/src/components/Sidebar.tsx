import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
    { to: '/', icon: '🏠', label: 'Dashboard' },
    { to: '/tasks', icon: '✅', label: 'Tasks' },
    { to: '/analytics', icon: '📊', label: 'Analytics' },
    { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <span className="sidebar-section-label">Navigation</span>
            {links.map(({ to, icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                    <span className="sidebar-icon">{icon}</span>
                    {label}
                </NavLink>
            ))}
        </aside>
    );
}
