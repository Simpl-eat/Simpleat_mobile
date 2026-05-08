import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { getProfileByUserId } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

export type AuthRoutingState = {
  session: Session | null;
  initialized: boolean;
  /** null = pas encore chargé (session présente) ou pas applicable (pas de session) */
  hasProfile: boolean | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
};

export function useAuthRouting(): AuthRoutingState {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    const { profile, error } = await getProfileByUserId(userId);
    if (error) {
      console.warn('[auth] lecture profile', error.message);
      setHasProfile(false);
    } else {
      setHasProfile(profile != null);
    }
    setProfileLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setHasProfile(null);
      return;
    }
    await loadProfile(userId);
  }, [session?.user?.id, loadProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setHasProfile(null);
      setProfileLoading(false);
      return;
    }

    void loadProfile(userId);
  }, [session?.user?.id, loadProfile]);

  return {
    session,
    initialized,
    hasProfile,
    profileLoading,
    refreshProfile,
  };
}
