import client from './client';
import type { Task, TaskCreate, TaskFilters, TaskListResponse, TaskUpdate } from '../types';

export const tasksApi = {
    getTasks: (params?: TaskFilters) =>
        client.get<TaskListResponse>('/api/tasks', { params }).then((r) => r.data),

    getTask: (id: number) =>
        client.get<Task>(`/api/tasks/${id}`).then((r) => r.data),

    createTask: (data: TaskCreate) =>
        client.post<Task>('/api/tasks', data).then((r) => r.data),

    updateTask: (id: number, data: TaskUpdate) =>
        client.put<Task>(`/api/tasks/${id}`, data).then((r) => r.data),

    deleteTask: (id: number) =>
        client.delete(`/api/tasks/${id}`),

    bulkCreateTasks: (tasks: TaskCreate[]) =>
        client.post<Task[]>('/api/tasks/bulk', { tasks }).then((r) => r.data),
};
