import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import TaskForm from './pages/TaskForm';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';

function ProtectedLayout() {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner fullPage />;
    if (!user) return <Navigate to="/login" replace />;
    return (
        <div className="app-layout">
            <Navbar />
            <Sidebar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tasks" element={<TaskList />} />
                    <Route path="/tasks/new" element={<TaskForm />} />
                    <Route path="/tasks/:id" element={<TaskDetail />} />
                    <Route path="/tasks/:id/edit" element={<TaskForm />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner fullPage />;
    if (user) return <Navigate to="/" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
    );
}

function ThemeManager({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<'light' | 'dark'>(() =>
        (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
    );

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Expose toggle via custom event
    useEffect(() => {
        const handler = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
        window.addEventListener('toggle-theme', handler);
        return () => window.removeEventListener('toggle-theme', handler);
    }, []);

    return <>{children}</>;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeManager>
                    <AppRoutes />
                </ThemeManager>
            </AuthProvider>
        </BrowserRouter>
    );
}
