import React, { useEffect, useState } from "react";

export default function Documents() {
  const [employeeId, setEmployeeId] = useState("");
  const [docs, setDocs] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) as { role?: string } : null;
  const role = (user?.role || '').toLowerCase();
  const canEdit = role === 'admin' || role === 'recruiter' || role === 'manager' || role === 'senior-manager' || role === 'senior manager';

  useEffect(() => {
    const eid = localStorage.getItem('employeeId');
    if (eid) setEmployeeId(eid);
  }, []);

  async function load() {
    setError(null);
    if (!employeeId) { setError('Employee ID missing'); return; }
    const token = localStorage.getItem('token') || '';
    const res = await fetch(`${base}/docs/${employeeId}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (res.ok) setDocs(json.documents || []);
    else setError(json?.error || 'Failed to load');
  }

  async function upload() {
    setError(null);
    if (!canEdit) { setError('You do not have permission to upload'); return; }
    if (!file || !employeeId) { setError('Choose a file'); return; }
    const token = localStorage.getItem('token') || '';
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${base}/docs/${employeeId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    const json = await res.json();
    if (res.ok) setDocs(json.documents || []);
    else setError(json?.error || 'Upload failed');
  }

  async function remove(p: string) {
    setError(null);
    if (!canEdit) { setError('You do not have permission to delete'); return; }
    const token = localStorage.getItem('token') || '';
    const res = await fetch(`${base}/docs/${employeeId}?path=${encodeURIComponent(p)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setDocs(docs.filter(d => d !== p));
  }

  useEffect(() => { if (employeeId) load(); }, [employeeId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-6">
        <h1 className="text-xl font-bold mb-4">Employee Documents</h1>
        <div className="flex gap-2 mb-4">
          <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="Employee ID" className="border rounded px-3 py-2 w-80" />
          <button onClick={load} className="px-4 py-2 border rounded">Load</button>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 mb-4">
            <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} />
            <button onClick={upload} className="px-4 py-2 bg-blue-600 text-white rounded">Submit Document</button>
          </div>
        )}
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <div className="space-y-2">
          {docs.map((p, i) => (
            <div key={i} className="flex items-center justify-between border rounded p-2">
              <a className="text-blue-600 underline" href={p} target="_blank" rel="noreferrer">{p}</a>
              {canEdit && <button onClick={() => remove(p)} className="px-3 py-1 border rounded">Delete</button>}
            </div>
          ))}
          {!docs.length && <div className="text-gray-500 text-sm">No documents.</div>}
        </div>
      </div>
    </div>
  );
}
