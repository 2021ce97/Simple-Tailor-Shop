import express from 'express';
import { apiRouter } from '../src/server/api.js';
import { initDatabase } from '../src/db/db.js';

const app = express();
app.use(express.json());

const databaseReady = initDatabase().catch(err => {
  console.warn('Vercel DB Init:', err.message);
});

app.use(async (_req, _res, next) => {
  await databaseReady;
  next();
});

app.use('/api', apiRouter);

export default app;
