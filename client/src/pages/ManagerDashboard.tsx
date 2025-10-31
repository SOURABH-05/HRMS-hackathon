import React from "react";
import { Link } from "react-router-dom";

export default function ManagerDashboard() {
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
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <div className="text-gray-600">Team operations, approvals, and performance</div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card title="Employees" to="/employees" desc="View your team's directory" />
          <Card title="Approve Leave" to="/leave/admin" desc="Approve or reject pending requests" />
          <Card title="Performance" to="/performance" desc="Record and review performance" />
          <Card title="Payroll" to="/payroll" desc="Adjust compensation when needed" />
          <Card title="AI Resume" to="/recruit/resume" desc="Screen candidate resumes" />
          <Card title="AI Interview" to="/recruit/interview" desc="Run screening interviews" />
        </div>
      </div>
    </div>
  );
}
