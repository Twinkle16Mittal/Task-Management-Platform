import client from './client';
import type { Comment } from '../types';

export const commentsApi = {
    getComments: (taskId: number) =>
        client.get<Comment[]>(`/api/tasks/${taskId}/comments`).then((r) => r.data),

    addComment: (taskId: number, data: { content: string }) =>
        client.post<Comment>(`/api/tasks/${taskId}/comments`, data).then((r) => r.data),

    updateComment: (commentId: number, data: { content: string }) =>
        client.put<Comment>(`/api/comments/${commentId}`, data).then((r) => r.data),

    deleteComment: (commentId: number) =>
        client.delete(`/api/comments/${commentId}`),
};
