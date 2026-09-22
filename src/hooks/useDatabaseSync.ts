import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { storageService } from '../services/storage';

export function useDatabaseSync(enabled: boolean, onSynced: () => void) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }
    const sync = async () => {
      const { error } = await supabase.from('orders').select('id', { head: true, count: 'exact' });
      setConnected(!error);
      if (!error && await storageService.syncFromDatabase()) onSynced();
    };
    sync();
    const interval = window.setInterval(sync, 4000);
    const onVisibility = () => { if (document.visibilityState === 'visible') sync(); };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, onSynced]);

  return connected;
}
