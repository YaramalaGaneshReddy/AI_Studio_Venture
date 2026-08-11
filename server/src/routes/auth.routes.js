import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email } = req.body;
  const user = {
    _id: 'guest-admin-id-12345',
    id: 'guest-admin-id-12345',
    name: name || 'Venture Architect',
    email: email || 'guest@ai-venture-studio.internal',
    role: 'admin'
  };
  return res.status(201).json(authPayload(user));
});

router.post('/login', async (req, res) => {
  const { email } = req.body;
  const user = {
    _id: 'guest-admin-id-12345',
    id: 'guest-admin-id-12345',
    name: 'Venture Architect',
    email: email || 'guest@ai-venture-studio.internal',
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
