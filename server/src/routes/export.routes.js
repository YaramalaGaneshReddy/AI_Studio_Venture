import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { requireAuth } from '../middleware/auth.js';
import { Project } from '../models/Project.js';
import { compileMarkdown } from '../services/report.service.js';

const router = Router();
router.use(requireAuth);

router.get('/:projectId/json', async (req, res) => {
  const project = await findProject(req);
  res.setHeader('Content-Disposition', `attachment; filename="${project.startupName}.json"`);
  res.json(project);
});

router.get('/:projectId/markdown', async (req, res) => {
  const project = await findProject(req);
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${project.startupName}.md"`);
  res.send(compileMarkdown(project));
});

router.get('/:projectId/pdf', async (req, res) => {
  const project = await findProject(req);
  const markdown = compileMarkdown(project);
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${project.startupName}.pdf"`);
  doc.pipe(res);
  doc.fontSize(22).text(`${project.startupName} Venture Blueprint`, { underline: true });
  doc.moveDown();
  markdown.split('\n').forEach((line) => {
    if (line.startsWith('# ')) doc.moveDown().fontSize(18).text(line.replace('# ', ''));
    else if (line.startsWith('## ')) doc.moveDown().fontSize(14).text(line.replace('## ', ''));
    else doc.fontSize(10).text(line);
  });
  doc.end();
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
