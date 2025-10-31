import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Performance() {
  const [employeeId, setEmployeeId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [period, setPeriod] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) as { role?: string; employeeId?: string } : null;
  const role = (user?.role || '').toLowerCase();
  const isAdminOrManager = role === 'admin' || role === 'manager' || role === 'senior-manager' || role === 'senior manager';

  useEffect(() => {
    const eid = localStorage.getItem('employeeId');
    if (eid) setEmployeeId(eid);
  }, []);

  async function load() {
    setError(null);
    if (!employeeId) { setError('Employee ID missing'); return; }
    const res = await api<any[]>(`/performance/${employeeId}`, { auth: true });
    if (res.data) setItems(res.data);
    else if (res.error) setError(res.error);
  }

  async function add() {
    setError(null);
    if (!isAdminOrManager) { setError('Only admin/manager can add performance records'); return; }
    if (!employeeId) { setError('Employee ID missing'); return; }
    if (!period) { setError('Period required'); return; }
    const r = Number(rating);
    if (Number.isNaN(r) || r < 0 || r > 10) { setError('Rating must be 0-10'); return; }
    await api(`/performance/${employeeId}`, { auth: true, method: 'POST', body: JSON.stringify({ period, rating: r, notes }) });
    setPeriod(""); setRating(0); setNotes("");
    load();
  }

  useEffect(() => { if (employeeId) load(); }, [employeeId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-6">
        <h1 className="text-xl font-bold mb-4">Performance</h1>
        <div className="flex gap-2 mb-4">
          {(!employeeId || isAdminOrManager) && (
            <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="Employee ID" className="border rounded px-3 py-2 w-64" />
          )}
          <button onClick={load} className="px-4 py-2 border rounded">Load</button>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="Period (e.g. 2025-Q4)" className="border rounded px-3 py-2" />
          <input type="number" value={rating} onChange={e=>setRating(Number(e.target.value))} placeholder="Rating (0-10)" className="border rounded px-3 py-2" />
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes" className="border rounded px-3 py-2" />
          <button onClick={add} className="px-4 py-2 bg-blue-600 text-white rounded md:col-span-3" disabled={!isAdminOrManager}>Add Rating</button>
        </div>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{it.period} — {it.rating}/10</div>
                {it.notes && <div className="text-sm text-gray-600">{it.notes}</div>}
              </div>
              <div className="text-sm text-gray-500">{it.date && new Date(it.date).toLocaleDateString()}</div>
            </div>
          ))}
          {!items.length && <div className="text-gray-500 text-sm">No performance records.</div>}
        </div>
      </div>
    </div>
  );
}
