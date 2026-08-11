import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { httpError } from '../utils/httpError.js';

const router = Router();

// Ensure user is authenticated
router.use(requireAuth);

// Ensure user has admin role (or auto-grant if user is the first user)
router.use(async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (User.db.readyState === 1) {
    const totalUsers = await User.countDocuments();
    if (totalUsers === 1) {
      req.user.role = 'admin';
      if (typeof req.user.save === 'function') await req.user.save();
      return next();
    }
  } else {
    const { getMemoryUsers } = await import('../services/memoryStore.js');
    if (getMemoryUsers().length === 1) {
      req.user.role = 'admin';
      return next();
    }
  }
  return next(httpError(403, 'Admin privilege required'));
});

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    if (User.db.readyState === 1) {
      const totalUsers = await User.countDocuments();
      const totalProjects = await Project.countDocuments();
      const allProjects = await Project.find({}, 'agentRuns startupScore');
      const totalAgentRuns = allProjects.reduce((acc, p) => acc + (p.agentRuns?.length || 0), 0);
      const completedRuns = allProjects.reduce(
        (acc, p) => acc + (p.agentRuns?.filter((r) => r.status === 'completed').length || 0),
        0
      );
      res.json({ totalUsers, totalProjects, totalAgentRuns, completedRuns, systemStatus: 'healthy' });
    } else {
      const { getMemoryUsers, getMemoryProjects } = await import('../services/memoryStore.js');
      const memUsers = getMemoryUsers();
      const memProjs = getMemoryProjects();
      res.json({
        totalUsers: memUsers.length,
        totalProjects: memProjs.length,
        totalAgentRuns: 0,
        completedRuns: 0,
        systemStatus: 'healthy (in-memory mode)'
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    if (User.db.readyState === 1) {
      const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 });
      res.json(users);
    } else {
      const { getMemoryUsers } = await import('../services/memoryStore.js');
      res.json(getMemoryUsers());
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) throw httpError(400, 'Invalid role');

    if (User.db.readyState === 1) {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) throw httpError(404, 'User not found');
      targetUser.role = role;
      await targetUser.save();
      res.json({ id: targetUser._id, name: targetUser.name, email: targetUser.email, role: targetUser.role });
    } else {
      const { updateMemoryUserRole } = await import('../services/memoryStore.js');
      res.json(updateMemoryUserRole(req.params.id, role));
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    if (req.params.id === currentUserId) {
      throw httpError(400, 'You cannot delete your own admin account');
    }
    if (User.db.readyState === 1) {
      const targetUser = await User.findByIdAndDelete(req.params.id);
      if (!targetUser) throw httpError(404, 'User not found');
      await Project.deleteMany({ user: targetUser._id });
    } else {
      const { deleteMemoryUser } = await import('../services/memoryStore.js');
      deleteMemoryUser(req.params.id);
    }
    res.json({ message: 'User and associated data deleted' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/projects
router.get('/projects', async (req, res, next) => {
  try {
    const projects = await Project.find().populate('user', 'name email').sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

export default router;
