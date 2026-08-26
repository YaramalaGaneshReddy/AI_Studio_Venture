import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server/src/server.js';
import { connectDatabase } from '../server/src/config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

// Create app once per cold start (module-level, cached across warm invocations)
const app = createApp();

export default async function handler(req, res) {
  // connectDatabase() is idempotent — returns immediately if already connected
  try {
    await connectDatabase();
  } catch (err) {
    console.error('[Vercel Handler] DB connection failed, using MemoryStore fallback:', err.message);
  }
  return app(req, res);
}
