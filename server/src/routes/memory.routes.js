import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { answerMemory, searchMemory } from '../services/memory.service.js';

const router = Router();
router.use(requireAuth);

router.get('/search', async (req, res) => {
  const query = req.query.q || req.query.query || '';
  const { answer, results } = await answerMemory(req.user._id || req.user.id, query);
  res.json({ answer, results });
});

router.post('/search', async (req, res) => {
  const query = req.body.query || req.body.q || '';
  const { answer, results } = await answerMemory(req.user._id || req.user.id, query);
  res.json({ answer, results });
});

router.post('/sources', async (req, res) => {
  const results = await searchMemory(req.user._id, req.body.query || '');
  res.json({ results });
});

export default router;
