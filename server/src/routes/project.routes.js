import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Project } from '../models/Project.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user._id || req.user.id;
  if (Project.db.readyState === 1) {
    const projects = await Project.find({ user: userId }).sort({ updatedAt: -1 });
    return res.json(projects);
  } else {
    const { getMemoryProjects } = await import('../services/memoryStore.js');
    const projects = getMemoryProjects().filter((p) => p.user === userId);
    return res.json(projects);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    if (Project.db.readyState === 1) {
      const project = await Project.create({ ...req.body, user: userId });
      return res.status(201).json(project);
    } else {
      const { createMemoryProject } = await import('../services/memoryStore.js');
      const project = createMemoryProject({ ...req.body, user: userId });
      return res.status(201).json(project);
    }
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    if (Project.db.readyState === 1) {
      const project = await Project.findOne({ _id: req.params.id, user: userId });
      if (!project) return res.status(404).json({ message: 'Project not found' });
      return res.json(project);
    } else {
      const { getMemoryProjects } = await import('../services/memoryStore.js');
      const project = getMemoryProjects().find((p) => (p._id === req.params.id || p.id === req.params.id) && p.user === userId);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      return res.json(project);
    }
  } catch (error) {
    next(error);
  }
});

router.post('/:id/run', async (req, res, next) => {
  try {
    const project = await findProject(req);
    const { runWorkflow } = await import('../services/workflow.service.js');
    const autoMode = req.body.autoMode ?? req.body.mode === 'auto';
    res.json(await runWorkflow(project, { mode: autoMode ? 'auto' : 'manual' }));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/agents/:agentKey/approve', async (req, res, next) => {
  try {
    const project = await findProject(req);
    const { decideAgent } = await import('../services/workflow.service.js');
    res.json(await decideAgent(project, req.params.agentKey, { decision: 'approve' }));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/agents/:agentKey/regenerate', async (req, res, next) => {
  try {
    const project = await findProject(req);
    const { decideAgent } = await import('../services/workflow.service.js');
    res.json(await decideAgent(project, req.params.agentKey, { decision: 'regenerate' }));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/email', async (req, res, next) => {
  try {
    const project = await findProject(req);
    const { sendVentureReportEmail } = await import('../services/email.service.js');
    const result = await sendVentureReportEmail(project, req.body.email || req.user.email);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

async function findProject(req) {
  const userId = req.user._id || req.user.id;
  if (Project.db.readyState === 1) {
    const project = await Project.findOne({ _id: req.params.id, user: userId });
    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }
    return project;
  } else {
    const { getMemoryProjects } = await import('../services/memoryStore.js');
    const project = getMemoryProjects().find((p) => (p._id === req.params.id || p.id === req.params.id) && p.user === userId);
    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }
    return project;
  }
}

export default router;
