import React from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const Card = ({ title, to, desc }: { title:string; to:string; desc:string }) => (
    <Link to={to} className="block card hover:shadow-lg transition">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="text-gray-600">Manage organization, people, payroll, and approvals</div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card title="Employees" to="/employees" desc="Browse and manage the employee directory" />
          <Card title="Approve Leave" to="/leave/admin" desc="Review, approve or reject leave requests" />
          <Card title="Payroll" to="/payroll" desc="Update salary, allowances, and taxes" />
          <Card title="Performance" to="/performance" desc="Track ratings and performance history" />
          <Card title="Documents" to="/docs" desc="Upload and manage employee documents" />
          <Card title="AI Resume" to="/recruit/resume" desc="Screen candidate resumes using AI" />
          <Card title="AI Interview" to="/recruit/interview" desc="Run conversational screening interviews" />
        </div>
      </div>
    </div>
  );
}
