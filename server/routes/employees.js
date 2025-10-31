import express from 'express';
import Employee from '../models/Employee.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { cacheGet, cacheSet } from '../redis.js';

const router = express.Router();

// Count all employees
router.get('/count', requireAuth, requireRole('admin', 'recruiter', 'employee'), async (req, res) => {
  try {
    const total = await Employee.countDocuments();
    res.json({ total });
  } catch (error) {
    console.error('Error counting employees:', error);
    res.status(500).json({ error: 'Failed to count employees' });
  }
});

// Find by email (helper for self-service)
router.get('/by-email', requireAuth, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email required' });
  const emp = await Employee.findOne({ email: String(email) });
  if (!emp) return res.status(404).json({ error: 'Not found' });
  res.json({ id: emp._id, name: emp.name, email: emp.email });
});

// List (paginated)
router.get('/', requireAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const key = `employees:list:${page}:${limit}`;
  const cached = await cacheGet(key);
  if (cached) return res.json(JSON.parse(cached));

  const docs = await Employee.find().sort({ joinDate: -1 }).skip((page-1)*limit).limit(limit);
  const total = await Employee.countDocuments();
  const payload = { employees: docs, total, page };
  await cacheSet(key, JSON.stringify(payload), 60);
  res.json(payload);
});

// Detail
router.get('/:id', requireAuth, async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Not found' });
  res.json(emp);
});

// Create
router.post('/', requireAuth, requireRole('admin','recruiter'), async (req, res) => {
  try {
    const emp = new Employee(req.body);
    await emp.save();
    res.status(201).json(emp);
  } catch(e) {
    res.status(400).json({ error: 'Failed to add employee' });
  }
});

// Update
router.put('/:id', requireAuth, requireRole('admin','recruiter'), async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch(e) {
    res.status(400).json({ error: 'Failed to update' });
  }
});

// Delete
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const del = await Employee.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch(e) {
    res.status(400).json({ error: 'Failed to delete' });
  }
});

export default router;
