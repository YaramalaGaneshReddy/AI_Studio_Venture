import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server/src/server.js';
import { connectDatabase } from '../server/src/config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const app = createApp();
connectDatabase().catch((err) => console.error('DB Error:', err.message));

export default app;
