import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { httpError } from '../utils/httpError.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return next(httpError(401, 'Authentication token missing'));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');

    let user = null;

    if (User?.db?.readyState === 1) {
      // MongoDB connected — look up by ObjectId
      try {
        user = await User.findById(payload.sub).lean();
      } catch (_dbErr) {}
    }

    if (!user) {
      // In-memory store lookup
      const { getMemoryUsers } = await import('../services/memoryStore.js');
      user = getMemoryUsers().find((u) => u._id === payload.sub || u.id === payload.sub) || null;
    }

    if (!user && payload.sub) {
      // Create synthetic user object directly from verified JWT token payload for stateless serverless resilience
      user = {
        _id: payload.sub,
        id: payload.sub,
        name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User'),
        email: payload.email || 'user@example.com',
        role: payload.role || 'user'
      };
    }

    if (!user) {
      return next(httpError(401, 'User session not found. Please log in again.'));
    }

    req.user = user;
    next();
  } catch (err) {
    // jwt.verify throws on invalid/expired tokens
    return next(httpError(401, 'Invalid or expired token. Please log in again.'));
  }
}

