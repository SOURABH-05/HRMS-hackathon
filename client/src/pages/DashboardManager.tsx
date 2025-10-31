import React from "react";
import { Link } from "react-router-dom";

export default function DashboardManager() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container">
        <h1 className="text-2xl font-bold mb-4">Manager Dashboard</h1>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card"><div className="text-sm text-gray-500">Team Size</div><div className="text-3xl font-bold">24</div></div>
          <div className="card"><div className="text-sm text-gray-500">Pending Leaves</div><div className="text-3xl font-bold">5</div></div>
          <div className="card"><div className="text-sm text-gray-500">Performance Items</div><div className="text-3xl font-bold">8</div></div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/employees" className="card hover:shadow-lg">Employees →</Link>
          <Link to="/leave/admin" className="card hover:shadow-lg">Approve Leaves →</Link>
          <Link to="/performance" className="card hover:shadow-lg">Performance →</Link>
          <Link to="/recruit/resume" className="card hover:shadow-lg">AI Resume →</Link>
          <Link to="/recruit/interview" className="card hover:shadow-lg">AI Interview →</Link>
        </div>
      </div>
    </div>
  );
}
