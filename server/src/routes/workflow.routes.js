import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Project } from '../models/Project.js';
import { decideAgent, runWorkflow } from '../services/workflow.service.js';

const router = Router();
router.use(requireAuth);

router.post('/:projectId/run', async (req, res, next) => {
  try {
    const project = await findProject(req);
    res.json(await runWorkflow(project, { mode: req.body.mode || 'manual' }));
  } catch (error) {
    next(error);
  }
});

router.post('/:projectId/agents/:agentKey/decision', async (req, res, next) => {
  try {
    const project = await findProject(req);
    res.json(await decideAgent(project, req.params.agentKey, req.body));
  } catch (error) {
    next(error);
  }
});

async function findProject(req) {
  const userId = req.user._id || req.user.id;
  if (Project.db.readyState === 1) {
    const project = await Project.findOne({ _id: req.params.projectId, user: userId });
    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }
    return project;
  } else {
    const { getMemoryProjects } = await import('../services/memoryStore.js');
    const project = getMemoryProjects().find((p) => (p._id === req.params.projectId || p.id === req.params.projectId) && p.user === userId);
    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }
    return project;
  }
}

export default router;
