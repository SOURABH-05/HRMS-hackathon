import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Payroll() {
  const [employeeId, setEmployeeId] = useState("");
  const [basePay, setBasePay] = useState<number>(0);
  const [allowances, setAllowances] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [netPay, setNetPay] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) as { role?: string; employeeId?: string } : null;
  const role = (user?.role || '').toLowerCase();
  const isAdminOrManager = role === 'admin' || role === 'manager' || role === 'senior-manager' || role === 'senior manager';

  useEffect(() => {
    const eid = localStorage.getItem('employeeId');
    if (eid) setEmployeeId(eid);
  }, []);

  async function load() {
    setMsg(null); setError(null);
    if (!employeeId) { setError('Employee ID missing'); return; }
    const res = await api<{ basePay:number; allowances:number; tax:number; netPay:number }>(`/payroll/${employeeId}`, { auth: true });
    if (res.data) {
      setBasePay(res.data.basePay || 0);
      setAllowances(res.data.allowances || 0);
      setTax(res.data.tax || 0);
      setNetPay(res.data.netPay || 0);
    } else if (res.error) setError(res.error);
  }

  async function save() {
    setMsg(null); setError(null);
    if (!isAdminOrManager) { setError('Only admin/manager can update payroll'); return; }
    if (!employeeId) { setError('Employee ID missing'); return; }
    const res = await api(`/payroll/${employeeId}`, { auth: true, method: 'PUT', body: JSON.stringify({ basePay, allowances, tax }) });
    if (res.data) {
      const d:any = res.data;
      setNetPay(d.netPay || 0);
      setMsg('Saved');
    } else if (res.error) setError(res.error);
  }

  useEffect(() => { if (employeeId) load(); }, [employeeId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white shadow rounded-xl p-6 space-y-3">
        <h1 className="text-xl font-bold">Payroll</h1>
        {(!employeeId || isAdminOrManager) && (
          <input value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="Employee ID" className="border rounded px-3 py-2 w-full" />
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Base Pay<input type="number" value={basePay} onChange={e=>setBasePay(Number(e.target.value))} className="border rounded px-3 py-2 w-full"/></label>
          <label className="block text-sm">Allowances<input type="number" value={allowances} onChange={e=>setAllowances(Number(e.target.value))} className="border rounded px-3 py-2 w-full"/></label>
          <label className="block text-sm">Tax<input type="number" value={tax} onChange={e=>setTax(Number(e.target.value))} className="border rounded px-3 py-2 w-full"/></label>
          <label className="block text-sm">Net Pay<input type="number" value={netPay} readOnly className="border rounded px-3 py-2 w-full bg-gray-100"/></label>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-4 py-2 border rounded">Load</button>
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={!isAdminOrManager}>Save</button>
        </div>
        {msg && <div className="text-sm text-green-700">{msg}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}
