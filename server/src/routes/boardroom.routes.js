import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { BoardroomSession } from '../models/BoardroomSession.js';
import { Project } from '../models/Project.js';
import { buildBoardroomPrompt } from '../prompts/agentPrompts.js';
import { generateWithOllama } from '../services/llm.service.js';

const roles = ['CEO', 'CTO', 'CFO', 'CMO', 'VC'];
const router = Router();
router.use(requireAuth);

router.post('/debate', async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let project = null;
    if (req.body.projectId) {
      if (Project.db.readyState === 1) {
        project = await Project.findOne({ _id: req.body.projectId, user: userId });
      } else {
        const { getMemoryProjects } = await import('../services/memoryStore.js');
        project = getMemoryProjects().find((p) => (p._id === req.body.projectId || p.id === req.body.projectId) && p.user === userId);
      }
    }

    const messages = [];
    for (const role of roles) {
      const result = await generateWithOllama(buildBoardroomPrompt(project || { startupName: 'General Startup', idea: req.body.question }, req.body.question, role));
      messages.push({ role: `${role} Agent`, content: result.content });
    }

    const consensus = buildConsensus(req.body.question, messages);
    let session;
    if (BoardroomSession.db.readyState === 1) {
      session = await BoardroomSession.create({
        user: userId,
        project: project ? (project._id || project.id) : undefined,
        question: req.body.question,
        messages,
        consensus
      });
    } else {
      session = {
        _id: `session_${Date.now()}`,
        user: userId,
        project: project ? (project._id || project.id) : undefined,
        question: req.body.question,
        messages,
        consensus,
        createdAt: new Date()
      };
    }

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

function buildConsensus(question, messages) {
  return `Question: ${question}

Consensus: Proceed with the strategy only if the first segment has clear willingness to pay, a reachable acquisition channel, and a product scope the team can ship inside the stated timeline.

Boardroom signal:
${messages.map((message) => `- ${message.role}: ${message.content.split('\n').find(Boolean)?.slice(0, 160)}`).join('\n')}`;
}

export default router;
