import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Employee from '../models/Employee.js'; // Import Employee model
import { jwtSecret } from '../config.js';

const router = express.Router();
// const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';

function norm(s = '') {
  return String(s || '').trim();
}

function normEmail(e = '') {
  return String(e || '').trim().toLowerCase();
}

// Register
router.post('/register', async (req, res) => {
  try {
    const name = norm(req.body?.name);
    const email = normEmail(req.body?.email);
    const password = norm(req.body?.password);
    const role = norm(req.body?.role);
    if (!name || !email || !password) return res.status(400).json({ error: 'Required fields missing' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    let employeeId = null;
    if (user.role === 'employee') {
      const employee = await Employee.create({ name, email, role: user.role, joinDate: new Date() });
      employeeId = employee._id;
    }

    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, employeeId } });
  } catch(err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const email = normEmail(req.body?.email);
    const password = norm(req.body?.password);
    if (!email || !password) return res.status(400).json({ error: 'Required fields missing' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email/password' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email/password' });
    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' });
    
    let employeeId = null;
    if (user.role === 'employee') {
      let employee = await Employee.findOne({ email: user.email });
      if (!employee) {
        // Create an employee record if one doesn't exist for this user
        employee = await Employee.create({ name: user.name, email: user.email, role: user.role, joinDate: new Date() });
      }
      employeeId = employee._id;
    }
    
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, employeeId } });
  } catch(err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
