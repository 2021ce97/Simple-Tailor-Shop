import express from 'express';
import { apiRouter } from '../src/server/api';
import { initDatabase } from '../src/db/db';

const app = express();
app.use(express.json());

initDatabase().catch(err => {
  console.warn('Vercel DB Init:', err.message);
});

app.use('/api', apiRouter);

export default app;
