import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// Get payroll by employeeId
router.get('/:employeeId', requireAuth, async (req, res) => {
  const emp = await Employee.findById(req.params.employeeId, { payroll: 1, name: 1, email: 1 });
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp.payroll || {});
});

// Update payroll (admin/manager)
router.put('/:employeeId', requireAuth, requireRole('admin','manager'), async (req, res) => {
  const { basePay = 0, allowances = 0, tax = 0 } = req.body || {};
  const netPay = Number(basePay) + Number(allowances) - Number(tax);
  const emp = await Employee.findByIdAndUpdate(
    req.params.employeeId,
    { $set: { payroll: { basePay, allowances, tax, netPay } } },
    { new: true, projection: { payroll: 1 } }
  );
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp.payroll);
});

export default router;
