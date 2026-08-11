import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Project } from '../models/Project.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const projects = await Project.find({ user: req.user._id });
  const runs = projects.flatMap((project) => project.agentRuns);
  const runtime = runs.map((run) => ({
    name: run.name,
    runtimeMs: run.runtimeMs || 0,
    tokenUsage: run.tokenUsage || 0,
    status: run.status
  }));
  const latestScore = projects[0]?.startupScore || {};
  res.json({
    runtime,
    completionRate: runs.length ? runs.filter((run) => run.status === 'completed').length / runs.length : 0,
    tokenUsage: runs.reduce((sum, run) => sum + (run.tokenUsage || 0), 0),
    mostUsedAgents: Object.values(
      runs.reduce((acc, run) => {
        acc[run.key] = acc[run.key] || { key: run.key, name: run.name, count: 0 };
        acc[run.key].count += run.status !== 'pending' ? 1 : 0;
        return acc;
      }, {})
    ),
    scoreRadar: [
      { metric: 'Market Demand', score: latestScore.marketDemand || 0 },
      { metric: 'Competition', score: latestScore.competition || 0 },
      { metric: 'Revenue', score: latestScore.revenuePotential || 0 },
      { metric: 'Technical', score: latestScore.technicalFeasibility || 0 },
      { metric: 'Execution', score: latestScore.executionComplexity || 0 }
    ]
  });
});

export default router;
