import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }
  const user = {
    _id: '000000000000000000000001',
    id: '000000000000000000000001',
    name: name || 'Venture Architect',
    email: email.toLowerCase().trim(),
    role: 'admin'
  };
  return res.status(201).json(authPayload(user));
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }
  const user = {
    _id: '000000000000000000000001',
    id: '000000000000000000000001',
    name: 'Venture Architect',
    email: email.toLowerCase().trim(),
    role: 'admin'
  };
  return res.json(authPayload(user));
});

router.post('/google', async (req, res) => {
  const { email, name } = req.body || {};
  const user = {
    _id: '000000000000000000000001',
    id: '000000000000000000000001',
    name: name || 'Google User',
    email: email || 'google.user@example.com',
    role: 'admin'
  };
  return res.json(authPayload(user));
});

function authPayload(user) {
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET || 'development-secret', { expiresIn: '7d' });
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
}

router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user._id || req.user.id,
      _id: req.user._id || req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'user'
    }
  });
});

export default router;
