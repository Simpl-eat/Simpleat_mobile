import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Ajuste selon ton arborescence
// Importer ton contexte d'authentification si tu en as un pour récupérer l'ID utilisateur

export function useRecipeLike(recipeId: string) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(true);

  // 1. Vérifier si l'utilisateur a déjà liké cette recette au chargement
  useEffect(() => {
    async function checkLikeStatus() {
      // TODO: Récupérer l'ID de l'utilisateur connecté
      const userId = 'USER_ID_ICI'; 
      
      try {
        const { data, error } = await supabase
          .from('user_likes') // <-- Nom de ta table de jointure à adapter
          .select('*')
          .eq('user_id', userId)
          .eq('recipe_id', recipeId)
          .single();

        if (data) setIsLiked(true);
      } catch (error) {
        console.error("Erreur lors de la vérification du like:", error);
      } finally {
        setIsLoadingLike(false);
      }
    }

    if (recipeId) checkLikeStatus();
  }, [recipeId]);

  // 2. Fonction pour Ajouter / Retirer le like
  const toggleLike = async () => {
    // TODO: Récupérer l'ID de l'utilisateur connecté
    const userId = 'USER_ID_ICI';
    
    // On met à jour l'UI immédiatement pour la réactivité (Optimistic UI)
    setIsLiked(!isLiked); 

    try {
      if (!isLiked) {
        // Ajouter le like
        await supabase
          .from('user_likes')
          .insert([{ user_id: userId, recipe_id: recipeId }]);
      } else {
        // Retirer le like
        await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', userId)
          .eq('recipe_id', recipeId);
      }
    } catch (error) {
      console.error("Erreur lors de l'action de like:", error);
      // En cas d'erreur réseau, on annule l'action sur l'UI
      setIsLiked(isLiked); 
    }
  };

  return { isLiked, toggleLike, isLoadingLike };
}