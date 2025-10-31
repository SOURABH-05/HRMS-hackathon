import React, { useState } from "react";
import { api } from "../api";
import type { AuthResponse } from "../authTypes";
import { Link, useNavigate } from "react-router-dom";

const roleOptions = [
  { label: "Employee", value: "employee" },
  { label: "Manager", value: "manager" },
  { label: "Senior Manager", value: "senior-manager" },
  { label: "HR Recruiter", value: "recruiter" },
  { label: "Admin", value: "admin" }
];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await api<AuthResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ name, email, password, role })
      }
    );
    setLoading(false);
    if (res.error) return setError(res.error);
    if (res.data) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <form className="w-80 bg-white shadow p-6 rounded-xl" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        <input
          className="block border rounded w-full mb-3 px-3 py-2"
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="block border rounded w-full mb-3 px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="block border rounded w-full mb-3 px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <select
          className="block border rounded w-full mb-3 px-3 py-2"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {roleOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 w-full disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
        <div className="mt-3 text-sm text-gray-600">
          Already have an account? <Link className="text-blue-600 underline" to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}
