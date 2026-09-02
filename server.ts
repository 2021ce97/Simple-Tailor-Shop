import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api';
import { initDatabase } from './src/db/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Database tables on startup
  initDatabase().catch(err => {
    console.warn('Database startup check:', err.message);
  });

  // Mount API routes
  app.use('/api', apiRouter);

  // Vite middleware for development / static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tailor Shop Server running on http://localhost:${PORT}`);
  });
}

startServer();
