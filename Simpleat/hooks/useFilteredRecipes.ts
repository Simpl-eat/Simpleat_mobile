import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types/recipe';

export type TimeFilter = '15' | '30' | '60' | '60+' | null;

export type SuggestionFilters = {
  search: string;
  dietColumn: string | null;
  timeFilter: TimeFilter;
  lunchType: string | null;
  category: string | null;
  area: string | null;
  onlyFromStock: boolean;
};

type FilterOptions = {
  lunchTypes: string[];
  categories: string[];
  areas: string[];
};

type UseFilteredRecipesResult = {
  recipes: Recipe[];
  isLoading: boolean;
  error: Error | null;
  filterOptions: FilterOptions;
  refetch: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Interval → minutes
// ---------------------------------------------------------------------------

export function intervalToMinutes(interval: string | null): number | null {
  if (!interval) return null;

  // HH:MM:SS (most common from Postgres)
  const hms = interval.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (hms) return parseInt(hms[1], 10) * 60 + parseInt(hms[2], 10);

  // Verbose: "2 hours 15 minutes", "1 day 03:00:00", …
  let total = 0;
  const d = interval.match(/(\d+)\s*day/i);
  const h = interval.match(/(\d+)\s*hour/i);
  const m = interval.match(/(\d+)\s*min/i);
  if (d) total += parseInt(d[1], 10) * 1440;
  if (h) total += parseInt(h[1], 10) * 60;
  if (m) total += parseInt(m[1], 10);
  if (total > 0) return total;

  // Mixed: "1 day 02:30:00"
  const mixed = interval.match(/(?:(\d+)\s*days?\s+)?(\d+):(\d{2}):(\d{2})/);
  if (mixed) {
    return (
      parseInt(mixed[1] ?? '0', 10) * 1440 +
      parseInt(mixed[2], 10) * 60 +
      parseInt(mixed[3], 10)
    );
  }

  return null;
}

function matchesTimeFilter(recipe: Recipe, filter: TimeFilter): boolean {
  if (!filter) return true;
  const minutes = intervalToMinutes(recipe.total_time);
  if (minutes === null) return filter !== '60+';
  switch (filter) {
    case '15':
      return minutes <= 15;
    case '30':
      return minutes <= 30;
    case '60':
      return minutes <= 60;
    case '60+':
      return minutes > 60;
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const EMPTY_OPTIONS: FilterOptions = { lunchTypes: [], categories: [], areas: [] };

export function useFilteredRecipes(filters: SuggestionFilters): UseFilteredRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_OPTIONS);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch available filter options once
  useEffect(() => {
    async function loadOptions() {
      const { data } = await supabase
        .from('recipe')
        .select('lunch_type, str_category, str_area')
        .is('deleted_at', null)
        .limit(3000);

      if (!data) return;

      const unique = (arr: (string | null)[]) =>
        [...new Set(arr.filter((v): v is string => v != null && v.trim() !== ''))].sort();

      setFilterOptions({
        lunchTypes: unique(data.map((r) => r.lunch_type)),
        categories: unique(data.map((r) => r.str_category)),
        areas: unique(data.map((r) => r.str_area)),
      });
    }
    loadOptions();
  }, []);

  // Main fetch
  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // --- "À partir de ce que j'ai" : eligible recipe IDs ---
      let eligibleIds: number[] | null = null;

      if (filters.onlyFromStock) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) throw new Error('Utilisateur non connecté.');

        const [stockRes, riRes] = await Promise.all([
          supabase
            .from('userStock')
            .select('ingredient_id')
            .eq('user_id', user.id)
            .is('deleted_at', null),
          supabase
            .from('recipeIngredient')
            .select('recipe_id, ingredient_id')
            .is('deleted_at', null),
        ]);

        if (stockRes.error) throw stockRes.error;
        if (riRes.error) throw riRes.error;

        const stockIds = new Set(
          (stockRes.data ?? []).map((s: { ingredient_id: number }) => s.ingredient_id),
        );

        const grouped = new Map<number, number[]>();
        for (const ri of riRes.data ?? []) {
          const typed = ri as { recipe_id: number; ingredient_id: number };
          const list = grouped.get(typed.recipe_id) ?? [];
          list.push(typed.ingredient_id);
          grouped.set(typed.recipe_id, list);
        }

        eligibleIds = [];
        for (const [recipeId, ingredientIds] of grouped) {
          if (ingredientIds.every((id) => stockIds.has(id))) {
            eligibleIds.push(recipeId);
          }
        }

        if (eligibleIds.length === 0) {
          setRecipes([]);
          setIsLoading(false);
          return;
        }
      }

      // --- Build Supabase query ---
      let query = supabase
        .from('recipe')
        .select('*')
        .is('deleted_at', null)
        .order('id', { ascending: false })
        .limit(200);

      if (filters.dietColumn) {
        query = query.eq(filters.dietColumn, true);
      }
      if (filters.lunchType) {
        query = query.eq('lunch_type', filters.lunchType);
      }
      if (filters.category) {
        query = query.eq('str_category', filters.category);
      }
      if (filters.area) {
        query = query.eq('str_area', filters.area);
      }
      if (debouncedSearch.trim()) {
        const term = `%${debouncedSearch.trim()}%`;
        query = query.or(`name_fr.ilike.${term},name.ilike.${term}`);
      }
      if (eligibleIds) {
        query = query.in('id', eligibleIds);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let results = (data as Recipe[]) ?? [];

      // --- Client-side time filter ---
      if (filters.timeFilter) {
        results = results.filter((r) => matchesTimeFilter(r, filters.timeFilter));
      }

      setRecipes(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    filters.dietColumn,
    filters.timeFilter,
    filters.lunchType,
    filters.category,
    filters.area,
    filters.onlyFromStock,
  ]);

  useEffect(() => {
    void fetchRecipes();
  }, [fetchRecipes]);

  return { recipes, isLoading, error, filterOptions, refetch: fetchRecipes };
}
