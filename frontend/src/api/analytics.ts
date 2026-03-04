import client from './client';
import type { OverviewStats, PerformanceMetric, TrendData } from '../types';

export const analyticsApi = {
    getOverview: () =>
        client.get<OverviewStats>('/api/analytics/overview').then((r) => r.data),

    getPerformance: () =>
        client.get<PerformanceMetric[]>('/api/analytics/performance').then((r) => r.data),

    getTrends: (days = 30) =>
        client.get<TrendData>('/api/analytics/trends', { params: { days } }).then((r) => r.data),

    exportTasks: () =>
        client
            .get('/api/analytics/export', { responseType: 'blob' })
            .then((r) => {
                const url = window.URL.createObjectURL(new Blob([r.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'tasks_export.csv');
                document.body.appendChild(link);
                link.click();
                link.remove();
            }),
};
