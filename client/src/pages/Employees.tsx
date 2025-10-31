import React, { useEffect, useState } from "react";
import { api } from "../api";

type Employee = {
  _id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
};

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(p: number) {
    setLoading(true);
    setError(null); // Clear previous errors
    const res = await api<{ employees: Employee[]; total: number; page: number }>(`/employees?page=${p}&limit=10`, { auth: true });
    setLoading(false);
    if (res.data) {
      setEmployees(res.data.employees);
      setTotal(res.data.total);
      setPage(res.data.page);
    } else if (res.error) {
      setError(res.error);
    }
  }

  useEffect(() => { load(page); }, []);

  const maxPage = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Employees</h1>
          <div className="text-sm text-gray-500">Total: {total}</div>
        </div>
        {error && <div className="text-red-500 mb-4">Error: {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Join Date</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e._id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{e.name}</td>
                  <td className="px-3 py-2">{e.email}</td>
                  <td className="px-3 py-2">{e.role}</td>
                  <td className="px-3 py-2">{new Date(e.joinDate).toLocaleDateString()}</td>
                </tr>
              ))}
              {!employees.length && (
                <tr>
                  <td className="px-3 py-8 text-center text-gray-500" colSpan={4}>{loading ? 'Loading...' : 'No data'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <button className="px-3 py-1 rounded border disabled:opacity-50" disabled={page<=1} onClick={() => { const p = Math.max(1, page-1); load(p); }}>
            Prev
          </button>
          <div className="text-sm">Page {page} / {maxPage}</div>
          <button className="px-3 py-1 rounded border disabled:opacity-50" disabled={page>=maxPage} onClick={() => { const p = Math.min(maxPage, page+1); load(p); }}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
