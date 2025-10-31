
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Employees from "./pages/Employees";
import ResumeScreen from "./pages/ResumeScreen";
import LeaveApply from "./pages/LeaveApply";
import LeaveAdmin from "./pages/LeaveAdmin";
import Payroll from "./pages/Payroll";
import Performance from "./pages/Performance";
import Documents from "./pages/Documents";
import Interview from "./pages/Interview";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import type { User } from "./authTypes";

function RoleDashboard() {
  const user = localStorage.getItem("user");
  const parsed: User | null = user ? JSON.parse(user) : null;
  const navigate = useNavigate();

  function logout() {
    localStorage.clear();
    navigate("/login");
  }
  if (!parsed) return <Navigate to="/login" />;
  const isAdmin = parsed.role === 'admin';
  const roleStr = (parsed?.role || '').toLowerCase();
  const isManager = roleStr === 'manager' || roleStr === 'senior-manager' || roleStr === 'senior manager';
  if (isAdmin) return <AdminDashboard />;
  if (isManager) return <ManagerDashboard />;
  // default compact dashboard for other roles
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Welcome, {parsed.name}</h1>
          <div className="text-gray-600">Role: {parsed.role}</div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/employees" className="card">Employees</Link>
          <Link to="/leave/apply" className="card">Apply Leave</Link>
          <Link to="/recruit/resume" className="card">AI Resume</Link>
          <Link to="/recruit/interview" className="card">AI Interview</Link>
        </div>
        <div className="mt-6"><button onClick={logout} className="btn-outline">Logout</button></div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");
  const parsed: User | null = rawUser ? JSON.parse(rawUser) : null;
  const isAdmin = parsed && parsed.role === 'admin';
  const roleStr = (parsed?.role || '').toLowerCase();
  const isManager = roleStr === 'manager' || roleStr === 'senior-manager' || roleStr === 'senior manager';
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/employees" element={token ? <Employees /> : <Navigate to="/login" />} />
      <Route path="/recruit/resume" element={token ? <ResumeScreen /> : <Navigate to="/login" />} />
      <Route path="/recruit/interview" element={token ? <Interview /> : <Navigate to="/login" />} />
      <Route path="/leave/apply" element={token ? <LeaveApply /> : <Navigate to="/login" />} />
      <Route path="/leave/admin" element={token ? ((isAdmin || isManager) ? <LeaveAdmin /> : <Navigate to="/leave/apply" />) : <Navigate to="/login" />} />
      <Route path="/docs" element={token && (isAdmin || (parsed && parsed.role==='recruiter') || isManager) ? <Documents /> : <Navigate to="/login" />} />
      <Route path="/payroll" element={token && (isAdmin || isManager) ? <Payroll /> : <Navigate to="/login" />} />
      <Route path="/performance" element={token && (isAdmin || isManager) ? <Performance /> : <Navigate to="/login" />} />
      <Route path="/*" element={token ? <RoleDashboard /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
