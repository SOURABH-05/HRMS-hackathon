import React, { useEffect, useState } from "react";
import { api } from "../api";

type LeaveItem = { type: string; from: string; to: string; status: string; notes?: string };
type EmpLeaves = { _id: string; name: string; email: string; leave: LeaveItem[] };

export default function LeaveAdmin() {
  const [items, setItems] = useState<EmpLeaves[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await api<{ items: EmpLeaves[] }>("/leave", { auth: true });
    setLoading(false);
    if (res.data) setItems(res.data.items);
  }

  async function act(empId: string, idx: number, action: 'approve'|'reject') {
    await api(`/leave/${empId}/${idx}/${action}`, { auth: true, method: 'POST' });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Leave Approvals</h1>
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
        </div>
        {items.map(emp => (
          <div key={emp._id} className="border rounded mb-4">
            <div className="px-3 py-2 bg-gray-100 font-medium">{emp.name} <span className="text-gray-500 text-sm">({emp.email})</span></div>
            <div className="p-3">
              {!emp.leave?.length && <div className="text-gray-500 text-sm">No requests</div>}
              {emp.leave?.map((lv, i) => (
                <div key={i} className="flex items-center justify-between border-b last:border-b-0 py-2">
                  <div>
                    <div className="font-medium">{lv.type} — {lv.status}</div>
                    <div className="text-sm text-gray-600">{new Date(lv.from).toLocaleDateString()} → {new Date(lv.to).toLocaleDateString()}</div>
                    {lv.notes && <div className="text-xs text-gray-500">{lv.notes}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => act(emp._id, i, 'approve')} className="px-3 py-1 border rounded">Approve</button>
                    <button onClick={() => act(emp._id, i, 'reject')} className="px-3 py-1 border rounded">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
