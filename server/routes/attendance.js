import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Employee from '../models/Employee.js';

const router = express.Router();

router.post('/clock-in', requireAuth, async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
  const emp = await Employee.findById(employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  emp.attendance.push({ clockIn: new Date(), clockOut: null });
  await emp.save();
  res.json({ success: true });
});

router.post('/clock-out', requireAuth, async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
  const emp = await Employee.findById(employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  const last = emp.attendance[emp.attendance.length - 1];
  if (!last || last.clockOut) return res.status(400).json({ error: 'No active clock-in' });
  last.clockOut = new Date();
  await emp.save();
  res.json({ success: true });
});

export default router;
