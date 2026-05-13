import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types/recipe';
import type { RecipeMacros } from '@/hooks/useRecipe';
import { type SuggestionFilters, intervalToMinutes } from '@/hooks/useFilteredRecipes';

export type RecipeWithMacros = Recipe & { macros: RecipeMacros | null };

type FilterOptions = { lunchTypes: string[]; categories: string[]; areas: string[] };

type UseLikedRecipesResult = {
  recipes: RecipeWithMacros[];
  isLoading: boolean;
  error: Error | null;
  filterOptions: FilterOptions;
  refetch: () => Promise<void>;
};

// Helper pour le temps
function matchesTimeFilter(recipe: Recipe, filter: string | null): boolean {
  if (!filter) return true;
  const minutes = intervalToMinutes(recipe.total_time);
  if (minutes === null) return filter !== '60+';
  switch (filter) {
    case '15': return minutes <= 15;
    case '30': return minutes <= 30;
    case '60': return minutes <= 60;
    case '60+': return minutes > 60;
    default: return true;
  }
}

export function useLikedRecipes(filters: Partial<SuggestionFilters>, isLiked: boolean = true): UseLikedRecipesResult {
  const [recipes, setRecipes] = useState<RecipeWithMacros[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // CORRECTION 1 : On type explicitement l'état pour éviter le "never[]"
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ lunchTypes: [], categories: [], areas: [] });

  // Charger les options de filtres au montage
  useEffect(() => {
    async function loadOptions() {
      const { data } = await supabase.from('recipe').select('lunch_type, str_category_fr, str_area_fr').is('deleted_at', null).limit(1000);
      if (!data) return;
      const unique = (arr: (string | null)[]) => [...new Set(arr.filter((v): v is string => v != null && v.trim() !== ''))].sort();
      setFilterOptions({
        lunchTypes: unique(data.map((r) => r.lunch_type)),
        categories: unique(data.map((r) => r.str_category_fr)),
        areas: unique(data.map((r) => r.str_area_fr)),
      });
    }
    loadOptions();
  }, []);

  const fetchLikedRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data: prefs } = await supabase
        .from('recipePreference')
        .select('recipe_id')
        .eq('user_id', user.id)
        .eq('preference', isLiked)
        .is('deleted_at', null);

      const recipeIds = prefs?.map(p => p.recipe_id) || [];
      if (recipeIds.length === 0) { setRecipes([]); return; }

      let query = supabase.from('recipe').select('*').in('id', recipeIds).is('deleted_at', null);

      if (filters.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`name_fr.ilike.${term},name.ilike.${term}`);
      }
      if (filters.lunchType) query = query.eq('lunch_type', filters.lunchType);
      if (filters.category) query = query.eq('str_category_fr', filters.category);
      if (filters.area) query = query.eq('str_area_fr', filters.area);
      if (filters.dietColumn) query = query.eq(filters.dietColumn, true);

      const { data: recipesData } = await query;

      const { data: ingData } = await supabase
        .from('recipeIngredient')
        .select('recipe_id, quantity, ingredient:ingredient_id(fat, carbohydrates, protein, fiber_g, calories)')
        .in('recipe_id', recipeIds);

      const ingredientsByRecipe = (ingData || []).reduce((acc: any, row: any) => {
        if (!acc[row.recipe_id]) acc[row.recipe_id] = [];
        acc[row.recipe_id].push(row);
        return acc;
      }, {});

      let finalRecipes: RecipeWithMacros[] = (recipesData || []).map((recipe) => {
        const rows = ingredientsByRecipe[recipe.id] || [];
        const computedMacros = rows.reduce((acc: any, row: any) => {
          const qty = row.quantity ?? 0;
          const ing = Array.isArray(row.ingredient) ? row.ingredient[0] : row.ingredient;
          if (!ing) return acc;
          return {
            fat: acc.fat + ((ing.fat ?? 0) * qty) / 100,
            carbohydrates: acc.carbohydrates + ((ing.carbohydrates ?? 0) * qty) / 100,
            protein: acc.protein + ((ing.protein ?? 0) * qty) / 100,
            fiber: acc.fiber + ((ing.fiber_g ?? 0) * qty) / 100,
            calories: acc.calories + ((ing.calories ?? 0) * qty) / 100,
          };
        }, { fat: 0, carbohydrates: 0, protein: 0, fiber: 0, calories: 0 });

        return { ...recipe, macros: rows.length > 0 ? computedMacros : null };
      });

      if (filters.timeFilter) {
        finalRecipes = finalRecipes.filter(r => matchesTimeFilter(r, filters.timeFilter as string));
      }

      setRecipes(finalRecipes);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLiked]);

  useEffect(() => { void fetchLikedRecipes(); }, [fetchLikedRecipes]);

  return { recipes, isLoading, error, filterOptions, refetch: fetchLikedRecipes };
}