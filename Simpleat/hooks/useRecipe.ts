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

// 1. On crée un type pour la liste des ingrédients formatés
export type FormattedIngredient = {
  quantity: number;
  unit_fr: string | null;
  name_fr: string;
};

type UseRecipeResult = {
  recipe: Recipe | null;
  macros: RecipeMacros | null;
  ingredients: FormattedIngredient[] | null; // <-- Ajout ici
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
  const [ingredients, setIngredients] = useState<FormattedIngredient[] | null>(null); // <-- Nouvel état
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecipe = useCallback(async () => {
    const rawId = id == null ? undefined : Array.isArray(id) ? id[0] : id;
    const recipeId = rawId?.trim();
    if (!recipeId) {
      setError(new Error('ID manquant'));
      setRecipe(null);
      setMacros(null);
      setIngredients(null);
      setIsLoading(false);
      return;
    }

    // id en base = bigint : on envoie un number
    const idNum = Number(recipeId);
    if (Number.isNaN(idNum) || String(idNum) !== recipeId) {
      setError(new Error(`ID invalide : "${recipeId}"`));
      setRecipe(null);
      setMacros(null);
      setIngredients(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRecipe(null);
    setMacros(null);
    setIngredients(null);
    setError(null);

    const [recipeResult, ingredientsResult] = await Promise.all([
      supabase
        .from('recipe')
        .select('*')
        .eq('id', idNum)
        .is('deleted_at', null)
        .maybeSingle(),
      // 2. MODIFICATION DE LA REQUÊTE : on ajoute unit_fr et name_fr
      supabase
        .from('recipeIngredient')
        .select('quantity, unit_fr, ingredient:ingredient_id(name_fr, fat, carbohydrates, protein, fiber_g, calories)')
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
  // 1. On adapte le type Row pour accepter un tableau d'objets pour 'ingredient'
  type Row = {
    quantity: number;
    unit_fr: string | null;
    ingredient: {
      name_fr: string | null;
      fat: number | null;
      carbohydrates: number | null;
      protein: number | null;
      fiber_g: number | null;
      calories: number | null;
    } | { // Parfois Supabase renvoie un tableau, parfois un objet selon la version/config
      name_fr: string | null;
      fat: number | null;
      carbohydrates: number | null;
      protein: number | null;
      fiber_g: number | null;
      calories: number | null;
    }[];
  };

  // On utilise "as unknown as Row[]" pour forcer le passage si TS est trop têtu
  const rows = ingredientsResult.data as unknown as Row[];
  
  const computed = rows.reduce(
    (acc, row) => {
      const qty = row.quantity ?? 0;
      // 2. On extrait l'ingrédient qu'il soit dans un tableau ou non
      const ing = Array.isArray(row.ingredient) ? row.ingredient[0] : row.ingredient;
      
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

  const formattedIngredients: FormattedIngredient[] = rows.map(row => {
    // 3. Pareil ici pour le nom de l'ingrédient
    const ing = Array.isArray(row.ingredient) ? row.ingredient[0] : row.ingredient;
    return {
      quantity: row.quantity ?? 0,
      unit_fr: row.unit_fr,
      name_fr: ing?.name_fr || 'Ingrédient inconnu'
    };
  });
  
  setIngredients(formattedIngredients);
}

    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  // 4. On retourne "ingredients" en plus du reste
  return { recipe, macros, ingredients, error, isLoading, refetch: fetchRecipe };
}