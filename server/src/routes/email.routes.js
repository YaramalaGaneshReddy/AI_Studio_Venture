import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Project } from '../models/Project.js';
import { compileMarkdown } from '../services/report.service.js';
import { sendReportEmail } from '../services/email.service.js';

const router = Router();
router.use(requireAuth);

router.post('/:projectId', async (req, res) => {
  const userId = req.user._id || req.user.id;
  let project = null;
  if (Project.db.readyState === 1) {
    project = await Project.findOne({ _id: req.params.projectId, user: userId });
  } else {
    const { getMemoryProjects } = await import('../services/memoryStore.js');
    project = getMemoryProjects().find((p) => (p._id === req.params.projectId || p.id === req.params.projectId) && p.user === userId);
  }
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const markdown = compileMarkdown(project);
  const result = await sendReportEmail({
    to: req.body.email,
    subject: `${project.startupName} Venture Blueprint`,
    text: 'Attached is your AI Venture Studio venture blueprint.',
    attachments: [{ filename: `${project.startupName}.md`, content: markdown }]
  });
  res.json(result);
});

export default router;
