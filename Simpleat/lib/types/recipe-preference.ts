/**
 * Table: public.recipePreference
 */
export type RecipePreference = {
  id: number;
  preference: boolean;
  user_id: string; // uuid
  recipe_id: number;
  deleted_at: string | null; // ISO timestamp with time zone
};
