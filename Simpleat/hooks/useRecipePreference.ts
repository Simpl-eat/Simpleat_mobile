import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user?.id) throw new Error('Utilisateur non connecté.');
  return user.id;
}

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

      // On enlève le .is('deleted_at', null) pour TOUJOURS récupérer la ligne
      // Cela évite les bugs d'insertion si l'utilisateur a déjà liké puis disliké dans le passé.
      const { data, error } = await supabase
        .from('recipePreference')
        .select('id, preference, deleted_at')
        .eq('user_id', userId)
        .eq('recipe_id', Number(recipeId))
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Si deleted_at n'est pas null, on considère qu'il n'y a pas de like actif (null)
        setPrefState(data.deleted_at === null ? data.preference : null);
        setRecordId(data.id);
      } else {
        setPrefState(null);
        setRecordId(null);
      }
    } catch (err) {
      console.error("Erreur Hook fetchData:", err);
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
        // La ligne existe déjà : on update la préférence et on annule le soft delete
        const { error } = await supabase
          .from('recipePreference')
          .update({ preference: value, deleted_at: null })
          .eq('id', recordId);

        if (error) throw error;
      } else {
        // La ligne n'existe pas : on l'insère
        const { data, error } = await supabase
          .from('recipePreference')
          .insert({
            user_id: userId,
            recipe_id: Number(recipeId),
            preference: value,
          })
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
      // Soft delete : on met à jour le champ deleted_at
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

  return {
    preference,
    isLoading,
    error,
    setPreference: updatePreference,
    removePreference,
    reload: fetchData,
  };
}