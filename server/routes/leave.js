import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// List leaves - employees see own; admin/manager see all
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  try {
    if (role === 'admin' || role === 'manager') {
      const emps = await Employee.find({}, { name: 1, email: 1, leave: 1 }).limit(5000);
      return res.json({ items: emps });
    }
    // find employee by email linked via auth email is not stored; fallback by email field matching user object is missing
    // For hackathon demo: allow client to pass employeeId query when not admin
    const employeeId = req.query.employeeId;
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
    const emp = await Employee.findById(employeeId, { name: 1, email: 1, leave: 1 });
    if (!emp) return res.status(404).json({ error: 'Not found' });
    res.json({ items: [emp] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// Apply leave - employee provides employeeId
router.post('/apply', requireAuth, async (req, res) => {
  try {
    const { employeeId, type, from, to, notes } = req.body || {};
    if (!employeeId || !type || !from || !to) {
      return res.status(400).json({ error: 'employeeId, type, from, to required' });
    }
    const emp = await Employee.findById(String(employeeId).trim());
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const item = { type, from: fromDate, to: toDate, status: 'applied', notes };
    try {
      emp.leave.push(item);
      await emp.save();
      return res.status(201).json({ success: true });
    } catch (e) {
      console.error('Error applying for leave (save):', e);
      return res.status(500).json({ error: 'Failed to apply for leave' });
    }
  } catch (e) {
    console.error('Error in /leave/apply handler:', e, 'body:', req.body);
    return res.status(500).json({ error: 'Internal error applying for leave' });
  }
});

// Approve
router.post('/:employeeId/:index/approve', requireAuth, requireRole('admin','manager'), async (req, res) => {
  const { employeeId, index } = req.params;
  const emp = await Employee.findById(employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  const idx = parseInt(index);
  if (!emp.leave[idx]) return res.status(404).json({ error: 'Leave not found' });
  emp.leave[idx].status = 'approved';
  await emp.save();
  res.json({ success: true });
});

// Reject
router.post('/:employeeId/:index/reject', requireAuth, requireRole('admin','manager'), async (req, res) => {
  const { employeeId, index } = req.params;
  const emp = await Employee.findById(employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  const idx = parseInt(index);
  if (!emp.leave[idx]) return res.status(404).json({ error: 'Leave not found' });
  emp.leave[idx].status = 'rejected';
  await emp.save();
  res.json({ success: true });
});

export default router;
