import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Project } from '../models/Project.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    let projects = [];

    if (Project.db?.readyState === 1) {
      projects = await Project.find({ user: req.user._id });
    } else {
      // In-memory fallback
      const { getMemoryProjects } = await import('../services/memoryStore.js');
      const userId = String(req.user._id || req.user.id);
      projects = getMemoryProjects().filter((p) => p.user === userId);
    }

    const runs = projects.flatMap((project) => project.agentRuns || []);

    const runtime = runs.map((run) => ({
      name: run.name,
      runtimeMs: run.runtimeMs || 0,
      tokenUsage: run.tokenUsage || 0,
      status: run.status
    }));

    const completedRuns = runs.filter((r) => r.status === 'completed');
    const completionRate = runs.length ? completedRuns.length / runs.length : 0;
    const tokenUsage = runs.reduce((sum, r) => sum + (r.tokenUsage || 0), 0);

    // Most used agents (count non-pending executions)
    const agentCounts = {};
    runs.forEach((run) => {
      if (!agentCounts[run.key]) agentCounts[run.key] = { key: run.key, name: run.name, count: 0 };
      if (run.status !== 'pending') agentCounts[run.key].count += 1;
    });
    const mostUsedAgents = Object.values(agentCounts).sort((a, b) => b.count - a.count);

    // Use most recent project with a score for the radar
    const latestWithScore = [...projects].reverse().find((p) => p.startupScore?.overall);
    const latestScore = latestWithScore?.startupScore || {};

    res.json({
      runtime,
      completionRate,
      tokenUsage,
      mostUsedAgents,
      scoreRadar: [
        { metric: 'Market Demand', score: latestScore.marketDemand || 0 },
        { metric: 'Competition', score: latestScore.competition || 0 },
        { metric: 'Revenue', score: latestScore.revenuePotential || 0 },
        { metric: 'Technical', score: latestScore.technicalFeasibility || 0 },
        { metric: 'Execution', score: latestScore.executionComplexity || 0 }
      ]
    });
  } catch (error) {
    next(error);
  }
});

export default router;
