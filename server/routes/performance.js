import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Employee from '../models/Employee.js';

const router = express.Router();

router.get('/:employeeId', requireAuth, async (req, res) => {
  const emp = await Employee.findById(req.params.employeeId, { performance: 1 });
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp.performance || []);
});

router.post('/:employeeId', requireAuth, requireRole('admin','manager'), async (req, res) => {
  const { period, rating, notes } = req.body || {};
  const entry = { period: period || '', rating: Number(rating) || 0, notes: notes || '', date: new Date() };
  const emp = await Employee.findById(req.params.employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  emp.performance.push(entry);
  await emp.save();
  res.status(201).json(entry);
});

export default router;
