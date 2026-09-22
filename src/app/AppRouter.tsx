import { useEffect, useState } from 'react';
import ShopManagementPage from '../pages/ShopManagementPage';
import { PublicTrackingView } from '../pages/PublicTrackingPage';

const PUBLIC_PATHS = new Set(['/', '/track', '/customer-tracking', '/customer-search']);

export function AppRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement)?.closest('a');
      const href = anchor?.getAttribute('href');
      if (!href || (href !== '/login' && !PUBLIC_PATHS.has(href))) return;
      event.preventDefault();
      window.history.pushState({}, '', href);
      setPath(href);
    };

    window.addEventListener('popstate', syncPath);
    document.addEventListener('click', navigate);
    return () => {
      window.removeEventListener('popstate', syncPath);
      document.removeEventListener('click', navigate);
    };
  }, []);

  return path === '/login' ? <ShopManagementPage /> : <PublicTrackingView />;
}
