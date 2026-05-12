import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types/recipe';

export type RecipeMacros = {
  fat: number;
  carbohydrates: number;
  protein: number;
  fiber: number;
  calories: number;
};

type UseRecipeResult = {
  recipe: Recipe | null;
  macros: RecipeMacros | null;
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
  const [macros, setMacros] = useState<RecipeMacros | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecipe = useCallback(async () => {
    const rawId = id == null ? undefined : Array.isArray(id) ? id[0] : id;
    const recipeId = rawId?.trim();
    if (!recipeId) {
      setError(new Error('ID manquant'));
      setRecipe(null);
      setMacros(null);
      setIsLoading(false);
      return;
    }

    // id en base = bigint : on envoie un number
    const idNum = Number(recipeId);
    if (Number.isNaN(idNum) || String(idNum) !== recipeId) {
      setError(new Error(`ID invalide : "${recipeId}"`));
      setRecipe(null);
      setMacros(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRecipe(null);
    setMacros(null);
    setError(null);

    const [recipeResult, ingredientsResult] = await Promise.all([
      supabase
        .from('recipe')
        .select('*')
        .eq('id', idNum)
        .is('deleted_at', null)
        .maybeSingle(),
      supabase
        .from('recipeIngredient')
        .select('quantity, ingredient:ingredient_id(fat, carbohydrates, protein, fiber_g, calories)')
        .eq('recipe_id', idNum)
        .is('deleted_at', null),
    ]);

    if (recipeResult.error) {
      setError(recipeResult.error as Error);
      setRecipe(null);
    } else {
      setRecipe(recipeResult.data as Recipe | null);
    }

    if (!ingredientsResult.error && ingredientsResult.data) {
      type Row = {
        quantity: number;
        ingredient: {
          fat: number | null;
          carbohydrates: number | null;
          protein: number | null;
          fiber_g: number | null;
          calories: number | null;
        } | null;
      };
      const rows = ingredientsResult.data as Row[];
      const computed = rows.reduce(
        (acc, row) => {
          const qty = row.quantity ?? 0;
          const ing = row.ingredient;
          if (!ing) return acc;
          return {
            fat: acc.fat + ((ing.fat ?? 0) * qty) / 100,
            carbohydrates: acc.carbohydrates + ((ing.carbohydrates ?? 0) * qty) / 100,
            protein: acc.protein + ((ing.protein ?? 0) * qty) / 100,
            fiber: acc.fiber + ((ing.fiber_g ?? 0) * qty) / 100,
            calories: acc.calories + ((ing.calories ?? 0) * qty) / 100,
          };
        },
        { fat: 0, carbohydrates: 0, protein: 0, fiber: 0, calories: 0 },
      );
      setMacros(computed);
    }

    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  return { recipe, macros, error, isLoading, refetch: fetchRecipe };
}
