/**
 * Table: public.ingredient
 */
export type Ingredient = {
  id: number;
  name: string;
  calories: number | null;
  fat: number | null;
  carbohydrates: number | null;
  protein: number | null;
  deleted_at: string | null; // ISO timestamp with time zone
};
