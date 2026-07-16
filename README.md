# Attendance Management System

A small SQL-backed attendance management system with an Express API and a React frontend.

## Features

- SQLite database with students, courses, enrollments, and attendance records
- Seed data for quick testing
- Add students from the UI
- Mark present, absent, late, or excused attendance by course and date
- View attendance totals and attendance rate summaries

## Run Locally

```powershell
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`.

## SQL Schema

The database schema lives in `server/schema.sql`. On first startup, the server creates `server/data/attendance.db` and seeds sample data.