/**
 * Table: public."recipeIngredient"
 */
export type RecipeIngredient = {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  measure_raw: string | null;
  quantity: number;
  unit: string | null;
  position: number;
  unit_fr: string | null;
  /** Colonne SQL `date` */
  deleted_at: string | null;
};
