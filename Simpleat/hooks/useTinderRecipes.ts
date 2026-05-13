import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types/recipe';

export function useTinderRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTinderRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // 1. Récupérer les IDs des recettes déjà traitées (likes & dislikes)
      const { data: preferences } = await supabase
        .from('recipePreference')
        .select('recipe_id')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      const ignoredIds = preferences?.map(p => p.recipe_id) || [];

      // 2. Récupérer un lot de recettes aléatoires (non traitées)
      let query = supabase
        .from('recipe')
        .select('*') // <-- CORRECTION ICI : On récupère tout pour que le type Recipe soit parfait !
        .is('deleted_at', null)
        .limit(15); // On en charge 15 d'un coup

      if (ignoredIds.length > 0) {
        query = query.not('id', 'in', `(${ignoredIds.join(',')})`);
      }

      const { data } = await query;
      
      // Mélanger le tableau (Shuffle) pour l'effet aléatoire
      // En utilisant `as Recipe[]`, TypeScript sait maintenant que les données correspondent
      const shuffled = (data as Recipe[] || []).sort(() => 0.5 - Math.random());
      setRecipes(shuffled);
      
    } catch (error) {
      console.error("Erreur Tinder Recipes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTinderRecipes();
  }, [fetchTinderRecipes]);

  return { recipes, setRecipes, isLoading, refetch: fetchTinderRecipes };
}