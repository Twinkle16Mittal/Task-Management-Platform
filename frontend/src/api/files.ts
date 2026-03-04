import client from './client';
import type { FileAttachment } from '../types';

export const filesApi = {
    getFiles: (taskId: number) =>
        client.get<FileAttachment[]>(`/api/tasks/${taskId}/files`).then((r) => r.data),

    uploadFiles: (taskId: number, files: File[]) => {
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        return client
            .post<FileAttachment[]>(`/api/tasks/${taskId}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((r) => r.data);
    },

    downloadFile: (fileId: number) =>
        client.get(`/api/files/${fileId}`, { responseType: 'blob' }).then((r) => r.data),

    deleteFile: (fileId: number) =>
        client.delete(`/api/files/${fileId}`),
};
