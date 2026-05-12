import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types/profile';

type UseProfileResult = {
  profile: Profile | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        throw new Error(authError?.message ?? 'Utilisateur non connecté.');
      }

      const { data, error: profileError } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(data as Profile | null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { profile, error, isLoading, refetch: fetchProfile };
}
