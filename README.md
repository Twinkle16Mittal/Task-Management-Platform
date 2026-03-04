# ⚡ TaskFlow — Task Management Platform

TaskFlow is a modern, full-stack task management application designed for teams to stay productive. It features task tracking, file attachments, real-time-ish comments, and comprehensive analytics.

---

## 🚀 Quick Start (Docker)

The fastest way to get started is using Docker Compose.

1.  **Start Docker Desktop** on your machine.
2.  **Run the application**:
    ```bash
    docker compose up --build -d
    ```
3.  **Access the app**:
    - **Frontend**: [http://localhost](http://localhost)
    - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠 Manual Setup

### 1. Backend (FastAPI + SQLite)
Requires Python 3.10+.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (React + Vite + TypeScript)
Requires Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```
By default, the frontend runs on [http://localhost:5173](http://localhost:5173).

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (required) | Used for JWT signing |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token expiry (1 week) |
| `DATABASE_URL` | `sqlite:///./taskmanager.db` | SQLite path |
| `UPLOAD_DIR` | `uploads/` | File storage path |
| `ALLOWED_ORIGINS` | `http://localhost:5173,...` | CORS whitelist |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

---

## 🏗 Architecture Decisions

- **FastAPI (Python)**: High-performance, asynchronous backend framework chosen for its speed and automatic documentation (Swagger).
- **SQLite**: Local file-based database used for simplicity and portability. In production, this can easily be swapped for PostgreSQL.
- **SQLAlchemy + Alembic**: ORM and migration tool for robust database management.
- **React + Vite**: Fast build times and modern development experience.
- **TypeScript**: Ensures type safety across the frontend, reducing runtime errors.
- **Recharts**: Simple and responsive charting library for the analytics page.
- **Nginx (Docker)**: Acts as a reverse proxy in Docker, serving the frontend and routing `/api/` requests to the backend.

---

## 📝 Assumptions Made

1.  **Single Org/Team**: Current implementation assumes all registered users can assign tasks to each other.
2.  **Privacy**: Scoped to the current user (creator or assignee).
3.  **Soft Deletes**: Tasks and comments use a `deleted_at` timestamp rather than permanent deletion, allowing for future "Undo" or "Trash" features.
4.  **Local Storage**: Currently stores JWT and user profile in `localStorage` for session persistence.
5.  **File Size**: Capped at 10MB per file to prevent storage exhaustion.

---

## 🛠 Features Implemented

- ✅ **Authentication**: JWT-based login/register with password hashing.
- ✅ **Task Management**: Full CRUD, search, filter by status/priority, and pagination.
- ✅ **Assignees**: Assign tasks to any registered user.
- ✅ **Comments**: Add/edit/delete comments on tasks.
- ✅ **Files**: Multiple file uploads per task with download support.
- ✅ **Analytics**: Overview KPIs, status/priority spreads, and task trends.
- ✅ **Export**: Download your task data as a CSV.
- ✅ **Responsive UI**: Glassmorphism design with dark mode support.