import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RecipePreference } from '@/lib/types/recipe-preference';

// --- HELPER PARTAGÉ ---
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user?.id) throw new Error('Utilisateur non connecté.');
  return user.id;
}

// ============================================================================
// 1. HOOK SINGULIER (Pour la page Détail : gère UNE SEULE recette)
// ============================================================================

type RecipePreferenceResult = {
  preference: boolean | null;
  isLoading: boolean;
  error: Error | null;
  setPreference: (value: boolean) => Promise<void>;
  removePreference: () => Promise<void>;
  reload: () => Promise<void>;
};

export function useRecipePreference(recipeId: string | number | undefined): RecipePreferenceResult {
  const [preference, setPrefState] = useState<boolean | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!recipeId) return;
    setIsLoading(true);
    setError(null);

    try {
      const userId = await getCurrentUserId();

      const { data, error } = await supabase
        .from('recipePreference')
        .select('id, preference, deleted_at')
        .eq('user_id', userId)
        .eq('recipe_id', Number(recipeId))
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPrefState(data.deleted_at === null ? data.preference : null);
        setRecordId(data.id);
      } else {
        setPrefState(null);
        setRecordId(null);
      }
    } catch (err) {
      console.error("Erreur Hook fetchData (Singulier):", err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const updatePreference = async (value: boolean) => {
    if (!recipeId) return;
    const previousPref = preference;
    setPrefState(value);
    setError(null);

    try {
      const userId = await getCurrentUserId();
      if (recordId) {
        const { error } = await supabase
          .from('recipePreference')
          .update({ preference: value, deleted_at: null })
          .eq('id', recordId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('recipePreference')
          .insert({ user_id: userId, recipe_id: Number(recipeId), preference: value })
          .select('id')
          .single();
        if (error) throw error;
        if (data) setRecordId(data.id);
      }
    } catch (err) {
      console.error("Erreur Hook updatePreference:", err);
      setPrefState(previousPref);
      setError(err instanceof Error ? err : new Error('Erreur lors de la sauvegarde'));
    }
  };

  const removePreference = async () => {
    if (!recordId) return;
    const previousPref = preference;
    setPrefState(null);
    setError(null);

    try {
      const { error } = await supabase
        .from('recipePreference')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', recordId);
      if (error) throw error;
    } catch (err) {
      console.error("Erreur Hook removePreference:", err);
      setPrefState(previousPref);
      setError(err instanceof Error ? err : new Error('Erreur lors de la suppression'));
    }
  };

  return { preference, isLoading, error, setPreference: updatePreference, removePreference, reload: fetchData };
}

// ============================================================================
// 2. HOOK PLURIEL (Pour la page Suggestions : gère TOUTES les recettes)
// ============================================================================

type UseRecipePreferencesResult = {
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
      const userId = await getCurrentUserId();
      const { data, error: fetchError } = await supabase
        .from('recipePreference')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null); // On ne charge que les likes/dislikes actifs pour la liste

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

  const togglePreference = useCallback(async (recipeId: number, like: boolean) => {
    try {
      const userId = await getCurrentUserId();

      // On vérifie d'abord en BDD si une ligne (même supprimée) existe pour éviter les erreurs d'unicité
      const { data: existingRow } = await supabase
        .from('recipePreference')
        .select('id, preference, deleted_at')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .maybeSingle();

      if (existingRow) {
        if (existingRow.preference === like && existingRow.deleted_at === null) {
          // Si c'est le même choix et que c'est actif -> On retire le like (Soft Delete)
          await supabase.from('recipePreference').update({ deleted_at: new Date().toISOString() }).eq('id', existingRow.id);
          setRaw((prev) => prev.filter((p) => p.id !== existingRow.id));
        } else {
          // Si le choix est différent (ex: passe de dislike à like, ou était supprimé) -> On met à jour
          await supabase.from('recipePreference').update({ preference: like, deleted_at: null }).eq('id', existingRow.id);
          
          setRaw((prev) => {
            const existsInState = prev.find((p) => p.id === existingRow.id);
            if (existsInState) {
              return prev.map((p) => (p.id === existingRow.id ? { ...p, preference: like } : p));
            }
            // Si c'était un soft delete, il n'était pas dans "raw", on l'ajoute
            return [...prev, { id: existingRow.id, user_id: userId, recipe_id: recipeId, preference: like } as RecipePreference];
          });
        }
      } else {
        // La ligne n'existe pas du tout -> On l'insère
        const { data, error: insertError } = await supabase
          .from('recipePreference')
          .insert({ user_id: userId, recipe_id: recipeId, preference: like })
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) setRaw((prev) => [...prev, data as RecipePreference]);
      }
    } catch (err) {
      console.error("Erreur Hook togglePreference (Pluriel):", err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    }
  }, []);

  return { preferences, isLoading, error, togglePreference };
}