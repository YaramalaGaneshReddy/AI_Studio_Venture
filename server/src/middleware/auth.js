import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { httpError } from '../utils/httpError.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw httpError(401, 'Authentication required');

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    let user = null;
    if (User.db.readyState === 1) {
      user = await User.findById(payload.sub);
    } else {
      const { getMemoryUsers } = await import('../services/memoryStore.js');
      user = getMemoryUsers().find((u) => u._id === payload.sub || u.id === payload.sub);
    }
    if (!user) throw httpError(401, 'Invalid token');

    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : httpError(401, 'Invalid token'));
  }
}
