// ─── User ────────────────────────────────────────────────────
export interface User {
    id: number;
    email: string;
    username: string;
    full_name: string | null;
    avatar: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Token {
    access_token: string;
    token_type: string;
    user: User;
}

export interface UserCreate {
    email: string;
    username: string;
    password: string;
    full_name?: string;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface UserUpdate {
    full_name?: string;
    username?: string;
    avatar?: string;
}

// ─── Task ─────────────────────────────────────────────────────
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    tags: string[];
    created_by: number;
    assigned_to: number | null;
    created_at: string;
    updated_at: string;
    creator?: User;
    assignee?: User;
    comment_count: number;
    file_count: number;
}

export interface TaskCreate {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string;
    tags?: string[];
    assigned_to?: number;
}

export interface TaskUpdate {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string;
    tags?: string[];
    assigned_to?: number;
}

export interface TaskListResponse {
    items: Task[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface TaskFilters {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    priority?: string;
    assigned_to?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

// ─── Comment ──────────────────────────────────────────────────
export interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    author?: User;
}

// ─── File ─────────────────────────────────────────────────────
export interface FileAttachment {
    id: number;
    task_id: number;
    uploaded_by: number;
    filename: string;
    original_name: string;
    file_size: number;
    content_type: string | null;
    created_at: string;
}

// ─── Analytics ────────────────────────────────────────────────
export interface StatusCount {
    status: string;
    count: number;
}

export interface PriorityCount {
    priority: string;
    count: number;
}

export interface OverviewStats {
    total_tasks: number;
    by_status: StatusCount[];
    by_priority: PriorityCount[];
    overdue_tasks: number;
    tasks_due_today: number;
    completed_this_week: number;
}

export interface PerformanceMetric {
    user_id: number;
    username: string;
    full_name: string | null;
    total_assigned: number;
    completed: number;
    in_progress: number;
    overdue: number;
    completion_rate: number;
}

export interface TrendPoint {
    date: string;
    created: number;
    completed: number;
}

export interface TrendData {
    trends: TrendPoint[];
}
