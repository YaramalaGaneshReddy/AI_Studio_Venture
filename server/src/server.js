import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import exportRoutes from './routes/export.routes.js';
import boardroomRoutes from './routes/boardroom.routes.js';
import memoryRoutes from './routes/memory.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import emailRoutes from './routes/email.routes.js';
import adminRoutes from './routes/admin.routes.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  app.get(['/api/health', '/health'], (_req, res) => res.json({ ok: true, service: 'ai-venture-studio' }));
  app.use(['/api/auth', '/auth'], authRoutes);
  app.use(['/api/projects', '/projects'], projectRoutes);
  app.use(['/api/workflows', '/workflows'], workflowRoutes);
  app.use(['/api/exports', '/exports'], exportRoutes);
  app.use(['/api/boardroom', '/boardroom'], boardroomRoutes);
  app.use(['/api/memory', '/memory'], memoryRoutes);
  app.use(['/api/analytics', '/analytics'], analyticsRoutes);
  app.use(['/api/email', '/email'], emailRoutes);
  app.use(['/api/admin', '/admin'], adminRoutes);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.status || 500).json({ message: error.message || 'Unexpected server error' });
  });

  return app;
}
