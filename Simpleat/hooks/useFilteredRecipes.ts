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
// Helpers
// ---------------------------------------------------------------------------

export function intervalToMinutes(interval: string | null): number | null {
  if (!interval) return null;

  const hms = interval.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (hms) return parseInt(hms[1], 10) * 60 + parseInt(hms[2], 10);

  let total = 0;
  const d = interval.match(/(\d+)\s*day/i);
  const h = interval.match(/(\d+)\s*hour/i);
  const m = interval.match(/(\d+)\s*min/i);
  if (d) total += parseInt(d[1], 10) * 1440;
  if (h) total += parseInt(h[1], 10) * 60;
  if (m) total += parseInt(m[1], 10);
  if (total > 0) return total;

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
    case '15': return minutes <= 15;
    case '30': return minutes <= 30;
    case '60': return minutes <= 60;
    case '60+': return minutes > 60;
    default: return true;
  }
}

// Nettoie la chaîne de caractères brute
function normalizeSearchTerm(str: string) {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[-_]/g, ' ') // Remplace tirets et underscores par des espaces
    .replace(/\s+/g, ' ') // Supprime les espaces multiples
    .trim();
}

// NOUVEAU : Crée un terme "Wildcard" (Joker) pour Supabase
// Transforme "gateau" en "g_t___" pour contourner le problème des accents en BDD
function createWildcardTerm(str: string) {
  const clean = normalizeSearchTerm(str);
  // Le '_' en SQL remplace n'importe quel caractère unique.
  // On remplace les voyelles (et le c pour la cédille) pour matcher les accents.
  return clean.replace(/[aeiouyc]/gi, '_');
}

// ---------------------------------------------------------------------------
// Hook Principal
// ---------------------------------------------------------------------------

const EMPTY_OPTIONS: FilterOptions = { lunchTypes: [], categories: [], areas: [] };

export function useFilteredRecipes(filters: SuggestionFilters): UseFilteredRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_OPTIONS);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    async function loadOptions() {
      const { data } = await supabase
        .from('recipe')
        .select('lunch_type, str_category_fr, str_area_fr')
        .is('deleted_at', null)
        .limit(3000);

      if (!data) return;

      const unique = (arr: (string | null)[]) =>
        [...new Set(arr.filter((v): v is string => v != null && v.trim() !== ''))].sort();

      setFilterOptions({
        lunchTypes: unique(data.map((r) => r.lunch_type)),
        categories: unique(data.map((r) => r.str_category_fr)),
        areas: unique(data.map((r) => r.str_area_fr)),
      });
    }
    loadOptions();
  }, []);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let eligibleIds: number[] | null = null;

      if (filters.onlyFromStock) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) throw new Error('Utilisateur non connecté.');

        const [stockRes, riRes] = await Promise.all([
          supabase.from('userStock').select('ingredient_id').eq('user_id', user.id).is('deleted_at', null),
          supabase.from('recipeIngredient').select('recipe_id, ingredient_id').is('deleted_at', null),
        ]);

        if (stockRes.error) throw stockRes.error;
        if (riRes.error) throw riRes.error;

        const stockIds = new Set((stockRes.data ?? []).map((s: any) => s.ingredient_id));
        const grouped = new Map<number, number[]>();
        
        for (const ri of riRes.data ?? []) {
          const list = grouped.get(ri.recipe_id) ?? [];
          list.push(ri.ingredient_id);
          grouped.set(ri.recipe_id, list);
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
        query = query.eq('str_category_fr', filters.category);
      }
      if (filters.area) {
        query = query.eq('str_area_fr', filters.area);
      }
      if (eligibleIds) {
        query = query.in('id', eligibleIds);
      }

      // 3. RECHERCHE ULTRA-ROBUSTE (Gère accents, typos, majuscules)
      if (debouncedSearch.trim()) {
        const exactTerm = `%${debouncedSearch.trim()}%`;
        const cleanTerm = `%${normalizeSearchTerm(debouncedSearch)}%`;
        const wildcardTerm = `%${createWildcardTerm(debouncedSearch)}%`;

        // On laisse Supabase chercher toutes les possibilités (avec ou sans accents)
        query = query.or(
          `name_fr.ilike.${wildcardTerm},name.ilike.${wildcardTerm},name_fr.ilike.${exactTerm},name_fr.ilike.${cleanTerm}`
        );
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let results = (data as Recipe[]) ?? [];

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