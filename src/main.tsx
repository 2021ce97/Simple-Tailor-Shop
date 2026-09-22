import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { clearLegacyBrowserData } from './lib/browserCleanup';

// Remove only the application's retired browser-cache keys. Supabase Auth's
// own session key is intentionally preserved so users remain signed in.
clearLegacyBrowserData();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
