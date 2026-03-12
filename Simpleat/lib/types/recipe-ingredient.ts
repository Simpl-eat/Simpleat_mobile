/**
 * Table: public.recipeIngredient
 */
export type RecipeIngredient = {
  id: number;
  quantity: number;
  unit: string | null;
  recipe_id: number;
  ingredient_id: number;
  deleted_at: string | null; // ISO timestamp with time zone
};
