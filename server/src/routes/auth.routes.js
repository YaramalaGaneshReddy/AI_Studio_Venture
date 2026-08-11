import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) throw httpError(400, 'Email and password are required');
    const normalizedEmail = email.toLowerCase().trim();

    if (User.db.readyState === 1) {
      const user = await User.createWithPassword({ name: name || normalizedEmail.split('@')[0], email: normalizedEmail, password });
      return res.status(201).json(authPayload(user));
    } else {
      const { registerMemoryUser } = await import('../services/memoryStore.js');
      return res.status(201).json(registerMemoryUser({ name, email: normalizedEmail, password }));
    }
  } catch (error) {
    next(error.code === 11000 ? httpError(409, 'Email already registered') : error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw httpError(400, 'Email and password are required');
    const normalizedEmail = email.toLowerCase().trim();

    if (User.db.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user || !(await user.verifyPassword(password))) throw httpError(401, 'Invalid email or password');
      return res.json(authPayload(user));
    } else {
      const { loginMemoryUser } = await import('../services/memoryStore.js');
      return res.json(loginMemoryUser({ email: normalizedEmail, password }));
    }
  } catch (error) {
    next(error);
  }
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
