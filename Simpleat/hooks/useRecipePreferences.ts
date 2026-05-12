import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { RecipePreference } from '@/lib/types/recipe-preference';

type UseRecipePreferencesResult = {
  /** recipe_id → true (liked) / false (disliked) */
  preferences: Map<number, boolean>;
  isLoading: boolean;
  error: Error | null;
  togglePreference: (recipeId: number, like: boolean) => Promise<void>;
};

export function useRecipePreferences(): UseRecipePreferencesResult {
  const [raw, setRaw] = useState<RecipePreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data, error: fetchError } = await supabase
        .from('recipePreference')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (fetchError) throw fetchError;
      setRaw((data as RecipePreference[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPreferences();
  }, [fetchPreferences]);

  const preferences = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const pref of raw) {
      map.set(pref.recipe_id, pref.preference);
    }
    return map;
  }, [raw]);

  const togglePreference = useCallback(
    async (recipeId: number, like: boolean) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;

        const existing = raw.find((p) => p.recipe_id === recipeId);

        if (existing) {
          if (existing.preference === like) {
            await supabase.from('recipePreference').delete().eq('id', existing.id);
            setRaw((prev) => prev.filter((p) => p.id !== existing.id));
          } else {
            const { error: updateError } = await supabase
              .from('recipePreference')
              .update({ preference: like })
              .eq('id', existing.id);
            if (updateError) throw updateError;
            setRaw((prev) =>
              prev.map((p) => (p.id === existing.id ? { ...p, preference: like } : p)),
            );
          }
        } else {
          const { data, error: insertError } = await supabase
            .from('recipePreference')
            .insert({ user_id: user.id, recipe_id: recipeId, preference: like })
            .select()
            .single();

          if (insertError) throw insertError;
          if (data) setRaw((prev) => [...prev, data as RecipePreference]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      }
    },
    [raw],
  );

  return { preferences, isLoading, error, togglePreference };
}
