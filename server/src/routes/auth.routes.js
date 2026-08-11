import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  registerMemoryUser,
  loginMemoryUser,
  authPayload,
  getMemoryUsers
} from '../services/memoryStore.js';
import { User } from '../models/User.js';

const router = Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Register ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Try MongoDB first; fall back to in-memory store
    if (User?.db?.readyState === 1) {
      const bcrypt = await import('bcryptjs');
      const exists = await User.findOne({ email: email.toLowerCase().trim() });
      if (exists) {
        return res.status(409).json({ message: 'Email already registered.' });
      }
      const passwordHash = await bcrypt.default.hash(password, 10);
      const totalUsers = await User.countDocuments();
      const doc = await User.create({
        name: name?.trim() || email.split('@')[0],
        email: email.toLowerCase().trim(),
        passwordHash,
        role: totalUsers === 0 ? 'admin' : 'user'
      });
      return res.status(201).json(authPayload(doc));
    }

    // In-memory path (Vercel/serverless)
    const result = registerMemoryUser({ name, email, password });
    return res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Try MongoDB first; fall back to in-memory store
    if (User?.db?.readyState === 1) {
      const bcrypt = await import('bcryptjs');
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user || !(await bcrypt.default.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      return res.json(authPayload(user));
    }

    // In-memory path
    const result = loginMemoryUser({ email, password });
    return res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
});

// ─── Google OAuth (simulated) ────────────────────────────────────────────────
router.post('/google', async (req, res, next) => {
  try {
    const { email, name } = req.body || {};

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'A valid Google account email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const displayName = name?.trim() || normalizedEmail.split('@')[0];

    // Check existing user; create if new
    if (User?.db?.readyState === 1) {
      let user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        const totalUsers = await User.countDocuments();
        user = await User.create({
          name: displayName,
          email: normalizedEmail,
          role: totalUsers === 0 ? 'admin' : 'user',
          passwordHash: 'google-oauth'
        });
      }
      return res.json(authPayload(user));
    }

    // In-memory path — find or create
    const users = getMemoryUsers();
    let existing = users.find((u) => u.email === normalizedEmail);
    if (existing) {
      return res.json(authPayload(existing));
    }
    const result = registerMemoryUser({ name: displayName, email: normalizedEmail, password: `google_${Date.now()}` });
    return res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
});

// ─── Me ──────────────────────────────────────────────────────────────────────
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
