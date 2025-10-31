# HRMS – Human Resource Management System

Full-stack MERN app with role-based dashboards, AI resume screening, scalable APIs, and hackathon-friendly setup.

## Tech Stack
- Frontend: React (Vite) + TypeScript + Tailwind CSS
- Backend: Node.js + Express (ESM) + MongoDB (Mongoose) + Redis (optional)
- AI: OpenAI API (configurable)

## Monorepo Structure
- `client/` – React app
- `server/` – Express API

## Quick Start (Local)
1. Create env files
   - `server/.env`:
     - `MONGO_URI=mongodb://localhost:27017/hrms` (or Atlas URI)
     - `JWT_SECRET=change_this_in_production`
     - `PORT=5000`
     - `REDIS_URL=redis://localhost:6379` (optional)
     - `OPENAI_API_KEY=sk-...` (optional for AI)
   - `client/.env`:
     - `VITE_API_BASE_URL=http://localhost:5000/api`
2. Install deps at root:
   ```bash
   npm install
   ```
3. Run both apps:
   ```bash
   npm run dev
   ```
4. Open: client (Vite URL, usually `http://localhost:5173`) and API health `http://localhost:5000/api/health`.

## Docker Compose (optional)
- Bring up Mongo, Redis, and Server:
  ```bash
  # From project root
  OPENAI_API_KEY=sk-... docker compose up --build
  ```
- API available at `http://localhost:5000`. Client can still run locally with `VITE_API_BASE_URL=http://localhost:5000/api`.

## Seed Data
```bash
npm run seed   # inserts 50 employees
```

## Auth & Roles
- Roles: `admin`, `manager`, `recruiter`, `employee`
- Endpoints:
  - `POST /api/auth/register {name,email,password,role}`
  - `POST /api/auth/login {email,password}` → `{ token, user }`
- Use `Authorization: Bearer <token>` for protected endpoints.

## Core API Endpoints
- Employees: `GET /api/employees?page=1&limit=10` (Redis-cached), `GET /api/employees/:id`, `POST /api/employees`, `PUT /api/employees/:id`, `DELETE /api/employees/:id`
- Attendance: `POST /api/attendance/clock-in {employeeId}`, `POST /api/attendance/clock-out {employeeId}`
- Payroll: `GET /api/payroll/:employeeId`, `PUT /api/payroll/:employeeId {basePay,allowances,tax}`
- Performance: `GET /api/performance/:employeeId`, `POST /api/performance/:employeeId {period,rating,notes}`
- Leave: `GET /api/leave` (admin/manager see all; others provide `employeeId` query), `POST /api/leave/apply {employeeId,type,from,to,notes}`, `POST /api/leave/:employeeId/:index/approve`, `POST /api/leave/:employeeId/:index/reject`
- AI Resume: `POST /api/recruit/resume` (multipart form-data `resume`: pdf/docx/txt)

## Frontend
- Login/Register → token stored in `localStorage`.
- Protected routes; dashboard links vary by role.
- Pages: Employees (paginated), Leave Apply/Admin, Payroll (admin/manager), Performance (admin/manager), AI Resume.

## Troubleshooting
- Tailwind not applying: ensure client `postcss.config.cjs` uses `@tailwindcss/postcss` and `client/src/style.css` has `@import "tailwindcss";`
- OpenAI error: check `OPENAI_API_KEY` in `server/.env` and restart server; `/api/health` should show `openaiConfigured: true`.
- Redis refused: Redis is optional; caching disables automatically if `REDIS_URL` is missing/unreachable.

## Scripts
- Root:
  - `npm run dev` – run server and client concurrently
  - `npm run seed` – seed 50 employees
- Server:
  - `npm run dev` – nodemon server
  - `npm run seed` – seed script
- Client:
  - `npm run dev` – Vite dev server

## Notes
- Keep secrets in `.env` files; never commit them.
- You can replace OpenAI with another LLM provider by swapping logic in `server/routes/recruit.js`.
