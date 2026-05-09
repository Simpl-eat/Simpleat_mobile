import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Ingredient } from '@/lib/types/ingredient';
import type { UserStock } from '@/lib/types/user-stock';

type FridgeResult = {
  ingredients: Ingredient[];
  stock: UserStock[];
  stockItems: Array<UserStock & { ingredient: Ingredient | null }>;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user?.id) {
    throw new Error('Utilisateur non connecté.');
  }

  return user.id;
}

export function useFridge(): FridgeResult {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stock, setStock] = useState<UserStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userId = await getCurrentUserId();

      const [ingredientResponse, stockResponse] = await Promise.all([
        supabase.from('ingredient').select('*').is('deleted_at', null),
        supabase
          .from('userStock')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null),
      ]);

      if (ingredientResponse.error) {
        throw ingredientResponse.error;
      }

      if (stockResponse.error) {
        throw stockResponse.error;
      }

      setIngredients(ingredientResponse.data ?? []);
      setStock(stockResponse.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stockItems = useMemo(
    () =>
      stock.map((item) => ({
        ...item,
        ingredient: ingredients.find((ingredient) => ingredient.id === item.ingredient_id) ?? null,
      })),
    [stock, ingredients]
  );

  return {
    ingredients,
    stock,
    stockItems,
    isLoading,
    error,
    reload: fetchData,
  };
}