import React from "react";
import { Link } from "react-router-dom";

export default function DashboardAdmin() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card"><div className="text-sm text-gray-500">Employees</div><div className="text-3xl font-bold">5K+</div></div>
          <div className="card"><div className="text-sm text-gray-500">Open Leaves</div><div className="text-3xl font-bold">12</div></div>
          <div className="card"><div className="text-sm text-gray-500">Payroll Updates</div><div className="text-3xl font-bold">3</div></div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/employees" className="card hover:shadow-lg">Manage Employees →</Link>
          <Link to="/leave/admin" className="card hover:shadow-lg">Approve Leaves →</Link>
          <Link to="/payroll" className="card hover:shadow-lg">Payroll →</Link>
          <Link to="/performance" className="card hover:shadow-lg">Performance →</Link>
          <Link to="/docs" className="card hover:shadow-lg">Documents →</Link>
          <div className="card space-y-2">
            <div className="font-medium">AI Tools</div>
            <div className="flex gap-2">
              <Link className="btn-outline" to="/recruit/resume">Resume</Link>
              <Link className="btn-outline" to="/recruit/interview">Interview</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
