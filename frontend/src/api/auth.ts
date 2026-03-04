import client from './client';
import type { Token, User, UserCreate, UserLogin, UserUpdate } from '../types';

export const authApi = {
    register: (data: UserCreate) =>
        client.post<Token>('/api/auth/register', data).then((r) => r.data),

    login: (data: UserLogin) =>
        client.post<Token>('/api/auth/login', data).then((r) => r.data),

    getMe: () =>
        client.get<User>('/api/auth/me').then((r) => r.data),

    updateProfile: (data: UserUpdate) =>
        client.put<User>('/api/auth/me', data).then((r) => r.data),
};
