import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types/recipe';

type UseRecipesResult = {
  recipes: Recipe[] | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

/**
 * Récupère un eliste de 5 recettes
 */
export function useRecipes(): UseRecipesResult {
  const [recipes, setRecipe] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from('recipe')
      .select('*')
      .limit(5)
      .is('deleted_at', null);

    if (supabaseError) {
      setError(supabaseError as Error);
      setRecipe(null);
    } else {
      setRecipe(data as Recipe[] | null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return { recipes, error, isLoading, refetch: fetchRecipes };
}
