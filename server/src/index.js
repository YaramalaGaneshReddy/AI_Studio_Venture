// Trigger nodemon wake up
import dotenv from 'dotenv';
import dns from 'node:dns';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './server.js';
import { connectDatabase } from './config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dns.setDefaultResultOrder('ipv4first');

const port = process.env.PORT || 5001;

const app = createApp();
// Server entrypoint - listening on port 5001
app.listen(port, () => {
  console.log(`AI Venture Studio API listening on http://localhost:${port}`);
});

connectDatabase().catch((error) => {
  console.error('Database connection error:', error.message);
});
