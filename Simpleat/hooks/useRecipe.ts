import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types/recipe';

type UseRecipeResult = {
  recipe: Recipe | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

/**
 * Récupère une recette par son id.
 * Bonne pratique : centraliser l’appel Supabase dans un hook réutilisable.
 */
export function useRecipe(id: string | undefined): UseRecipeResult {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecipe = useCallback(async () => {
    const rawId = id == null ? undefined : Array.isArray(id) ? id[0] : id;
    const recipeId = rawId?.trim();
    if (!recipeId) {
      setError(new Error('ID manquant'));
      setRecipe(null);
      setIsLoading(false);
      return;
    }

    // id en base = bigint : on envoie un number
    const idNum = Number(recipeId);
    if (Number.isNaN(idNum) || String(idNum) !== recipeId) {
      setError(new Error(`ID invalide : "${recipeId}"`));
      setRecipe(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRecipe(null);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from('recipe')
      .select('*')
      .eq('id', idNum)
      .is('deleted_at', null)
      .maybeSingle();

    if (supabaseError) {
      setError(supabaseError as Error);
      setRecipe(null);
    } else {
      setRecipe(data as Recipe | null);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  return { recipe, error, isLoading, refetch: fetchRecipe };
}
