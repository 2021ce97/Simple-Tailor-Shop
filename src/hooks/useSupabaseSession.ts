import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { storageService } from '../services/storage';

export interface AppUser { email: string; name: string }

const mapUser = (user: { email?: string; user_metadata?: Record<string, any> }): AppUser => ({
  email: user.email || '',
  name: String(user.user_metadata?.name || user.email?.split('@')[0] || 'Admin'),
});

export function useSupabaseSession(onDataReady: () => void) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const hydrate = useCallback(async () => {
    await storageService.syncFromDatabase();
    onDataReady();
  }, [onDataReady]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser(mapUser(data.user));
        hydrate().catch(console.error);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ? mapUser(session.user) : null);
    });
    return () => listener.subscription.unsubscribe();
  }, [hydrate]);

  const loginSucceeded = useCallback(async (user: AppUser) => {
    storageService.saveAuthUser(user);
    setCurrentUser(user);
    await hydrate();
  }, [hydrate]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    storageService.saveAuthUser(null);
    setCurrentUser(null);
  }, []);

  return { currentUser, loginSucceeded, signOut };
}
