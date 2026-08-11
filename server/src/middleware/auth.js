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
      user = await User.findById(payload.sub).lean();
    } else {
      // In-memory store (Vercel/serverless)
      const { getMemoryUsers } = await import('../services/memoryStore.js');
      user = getMemoryUsers().find((u) => u._id === payload.sub || u.id === payload.sub) || null;
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
