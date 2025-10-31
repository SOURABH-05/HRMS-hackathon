import React, { useState } from "react";
import { api } from "../api";
import type { AuthResponse } from "../authTypes";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await api<AuthResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password })
      }
    );
    setLoading(false);
    if (res.error) return setError(res.error);
    if (res.data) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      console.log("Login successful, user data:", res.data.user); // Added for debugging
      if (res.data.user.employeeId) {
        localStorage.setItem("employeeId", res.data.user.employeeId);
      }
      navigate("/");
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <form className="w-80 bg-white shadow p-6 rounded-xl" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Login</h2>
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
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 w-full disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
        <div className="mt-3 text-sm text-gray-600">
          No account? <Link className="text-blue-600 underline" to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
}
