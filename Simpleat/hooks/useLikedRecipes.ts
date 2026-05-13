import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types/recipe';
import type { RecipeMacros } from '@/hooks/useRecipe';

export type RecipeWithMacros = Recipe & { macros: RecipeMacros | null };

type UseLikedRecipesResult = {
  recipes: RecipeWithMacros[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user?.id) throw new Error('Utilisateur non connecté.');
  return user.id;
}

export function useLikedRecipes(searchTerm: string = ''): UseLikedRecipesResult {
  const [recipes, setRecipes] = useState<RecipeWithMacros[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLikedRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userId = await getCurrentUserId();

      // 1. Récupérer les IDs des recettes likées
      const { data: likes, error: likesError } = await supabase
        .from('recipePreference')
        .select('recipe_id')
        .eq('user_id', userId)
        .eq('preference', true)
        .is('deleted_at', null);

      if (likesError) throw likesError;

      const recipeIds = likes?.map(l => l.recipe_id) || [];

      if (recipeIds.length === 0) {
        setRecipes([]);
        setIsLoading(false);
        return;
      }

      // 2. Récupérer les recettes
      let query = supabase
        .from('recipe')
        .select('*')
        .in('id', recipeIds)
        .is('deleted_at', null);

      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(`name_fr.ilike.${term},name.ilike.${term}`);
      }

      const { data: recipesData, error: recipesError } = await query;
      if (recipesError) throw recipesError;

      // 3. Récupérer les ingrédients pour calculer les macros
      // On récupère les ingrédients pour TOUTES les recettes likées d'un coup
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('recipeIngredient')
        .select('recipe_id, quantity, ingredient:ingredient_id(fat, carbohydrates, protein, fiber_g, calories)')
        .in('recipe_id', recipeIds)
        .is('deleted_at', null);

      if (ingredientsError) throw ingredientsError;

      // Grouper les ingrédients par recipe_id
      const ingredientsByRecipe = (ingredientsData || []).reduce((acc: any, row: any) => {
        if (!acc[row.recipe_id]) acc[row.recipe_id] = [];
        acc[row.recipe_id].push(row);
        return acc;
      }, {});

      // 4. Calculer les macros et assembler les résultats
      const finalRecipes: RecipeWithMacros[] = (recipesData || []).map((recipe) => {
        const rows = ingredientsByRecipe[recipe.id] || [];
        const computedMacros = rows.reduce(
          (acc: any, row: any) => {
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
          { fat: 0, carbohydrates: 0, protein: 0, fiber: 0, calories: 0 }
        );

        return {
          ...(recipe as Recipe),
          macros: rows.length > 0 ? computedMacros : null,
        };
      });

      setRecipes(finalRecipes);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    void fetchLikedRecipes();
  }, [fetchLikedRecipes]);

  return { recipes, isLoading, error, refetch: fetchLikedRecipes };
}