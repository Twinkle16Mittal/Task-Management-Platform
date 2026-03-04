import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Token, UserCreate, UserLogin } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (credentials: UserLogin) => Promise<void>;
    register: (data: UserCreate) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const handleTokenResponse = (data: Token) => {
        setToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
    };

    const login = async (credentials: UserLogin) => {
        const data = await authApi.login(credentials);
        handleTokenResponse(data);
    };

    const register = async (userData: UserCreate) => {
        const data = await authApi.register(userData);
        handleTokenResponse(data);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
