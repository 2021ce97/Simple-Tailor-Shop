import express from 'express';
import { apiRouter } from '../src/server/api.js';
import { initDatabase } from '../src/db/db.js';

const app = express();
app.use(express.json());

initDatabase().catch(err => {
  console.warn('Vercel DB Init:', err.message);
});

app.use('/api', apiRouter);

export default app;
