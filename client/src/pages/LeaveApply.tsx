import React, { useEffect, useState } from "react";
import { api } from "../api";

function toISO(d: string) {
  // Accept YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY
  if (!d) return d;
  const s = d.replace(/\//g,'-');
  const parts = s.split('-');
  if (parts[0].length === 4) return s; // already YYYY-MM-DD
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    if (yyyy?.length === 4) return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  }
  return s;
}

export default function LeaveApply() {
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState("Casual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Re-added loading state

  useEffect(() => {
    const eid = localStorage.getItem('employeeId');
    console.log('employeeId from localStorage:', eid); // Add this line for debugging
    if (eid) setEmployeeId(eid);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!employeeId) return setMsg('Employee ID missing');
    if (!from || !to) return setMsg('Please provide from and to dates');
    setLoading(true);
    const res = await api<{success:true}>(`/leave/apply`, { auth: true, method: 'POST', body: JSON.stringify({ employeeId, type, from: toISO(from), to: toISO(to), notes }) });
    setLoading(false);
    if (res.error) {
      if (res.error.toLowerCase().includes('unauthorized')) setMsg('Please login again.');
      else setMsg(res.error);
    } else setMsg('Applied!');
  }

  const hasStoredId = Boolean(localStorage.getItem('employeeId'));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto card">
        <h1 className="text-xl font-bold mb-4">Apply Leave</h1>
        <form onSubmit={submit} className="space-y-3">
          {!hasStoredId && (
            <input 
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="Employee ID" 
              required={!hasStoredId} 
              className="block border rounded w-full px-3 py-2"
            />
          )}
          <input value={type} onChange={e=>setType(e.target.value)} placeholder="Type" className="block border rounded w-full px-3 py-2" />
          <input value={from} onChange={e=>setFrom(e.target.value)} placeholder="From (YYYY-MM-DD)" className="block border rounded w-full px-3 py-2" />
          <input value={to} onChange={e=>setTo(e.target.value)} placeholder="To (YYYY-MM-DD)" className="block border rounded w-full px-3 py-2" />
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes" className="block border rounded w-full px-3 py-2" />
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 w-full disabled:opacity-50" disabled={loading}>Submit</button>
        </form>
        {msg && <div className="mt-3 text-sm">{msg}</div>}
      </div>
    </div>
  );
}
