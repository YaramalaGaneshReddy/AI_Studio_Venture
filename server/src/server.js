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

const CORS_OPTIONS = {
  origin: true,                   // reflect request origin — works for all Vercel preview URLs
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204       // some browsers choke on 200 for OPTIONS
};

export function createApp() {
  const app = express();

  // Pre-flight OPTIONS must be answered BEFORE any other middleware
  app.options('*', cors(CORS_OPTIONS));
  app.use(cors(CORS_OPTIONS));
  app.use(express.json({ limit: '5mb' }));

  // Health check
  app.get(['/api/health', '/health'], (_req, res) =>
    res.json({ ok: true, service: 'ai-venture-studio', ts: Date.now() })
  );

  // Routes — both with and without /api prefix so Vercel rewrites + direct calls both work
  app.use(['/api/auth', '/auth'], authRoutes);
  app.use(['/api/projects', '/projects'], projectRoutes);
  app.use(['/api/workflows', '/workflows'], workflowRoutes);
  app.use(['/api/exports', '/exports'], exportRoutes);
  app.use(['/api/boardroom', '/boardroom'], boardroomRoutes);
  app.use(['/api/memory', '/memory'], memoryRoutes);
  app.use(['/api/analytics', '/analytics'], analyticsRoutes);
  app.use(['/api/email', '/email'], emailRoutes);
  app.use(['/api/admin', '/admin'], adminRoutes);

  // 404 handler for unmatched /api routes
  app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found' }));

  // Central error handler
  app.use((error, _req, res, _next) => {
    console.error('[server error]', error.message || error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Unexpected server error' });
  });

  return app;
}
