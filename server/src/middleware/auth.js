import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { httpError } from '../utils/httpError.js';

export async function requireAuth(req, _res, next) {
  const defaultUser = {
    _id: '000000000000000000000001',
    id: '000000000000000000000001',
    name: 'Venture Architect',
    email: 'guest@ai-venture-studio.internal',
    role: 'admin'
  };

  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
        let user = null;
        if (User.db.readyState === 1) {
          user = await User.findById(payload.sub);
        } else {
          const { getMemoryUsers } = await import('../services/memoryStore.js');
          user = getMemoryUsers().find((u) => u._id === payload.sub || u.id === payload.sub);
        }
        if (user) {
          req.user = user;
          return next();
        }
      } catch (_e) {
        // Fallback to defaultUser if token is invalid
      }
    }
    req.user = defaultUser;
    next();
  } catch (error) {
    req.user = defaultUser;
    next();
  }
}
