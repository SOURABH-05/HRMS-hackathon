import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config.js';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(auth.split(' ')[1], jwtSecret);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function normalize(role) {
  return String(role || '').toLowerCase().replace(/\s+/g, '-');
}

export function requireRole(...roles) {
  const normalizedAllowed = new Set(roles.map(normalize));
  return (req, res, next) => {
    const userRole = normalize(req.user?.role);
    // Manager synonyms: senior-manager counts as manager
    const isManagerAllowed = normalizedAllowed.has('manager');
    const isUserManagerLike = userRole === 'manager' || userRole === 'senior-manager' || userRole === 'seniormanager';
    const allowed = normalizedAllowed.has(userRole) || (isManagerAllowed && isUserManagerLike);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
