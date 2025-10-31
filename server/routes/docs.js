import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Employee from '../models/Employee.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const uploadDir = path.resolve('server', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// List employee documents
router.get('/:employeeId', requireAuth, async (req, res) => {
  const emp = await Employee.findById(req.params.employeeId, { documents: 1 });
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json({ documents: emp.documents || [] });
});

// Upload document (admin/recruiter/manager)
router.post('/:employeeId', requireAuth, requireRole('admin','recruiter','manager'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const rel = `/uploads/${path.basename(req.file.path)}`;
  const emp = await Employee.findByIdAndUpdate(req.params.employeeId, { $push: { documents: rel } }, { new: true, projection: { documents: 1 } });
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.status(201).json({ path: rel, documents: emp.documents });
});

// Delete by path (admin/recruiter/manager)
router.delete('/:employeeId', requireAuth, requireRole('admin','recruiter','manager'), async (req, res) => {
  const { path: docPath } = req.query;
  if (!docPath) return res.status(400).json({ error: 'path query required' });
  const emp = await Employee.findByIdAndUpdate(req.params.employeeId, { $pull: { documents: docPath } }, { new: true, projection: { documents: 1 } });
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  const abs = path.resolve(docPath.replace(/^\//,''));
  fs.unlink(abs, () => {});
  res.json({ success: true });
});

export default router;
