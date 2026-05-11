/**
 * Table: public.ingredient
 */
export type Ingredient = {
  id: number;
  external_name: string;
  name: string;
  calories: number | null;
  fat: number | null;
  carbohydrates: number | null;
  protein: number | null;
  name_fr: string | null;
  fdc_id: number | null;
  nutrition_source: string | null;
  nutrition_reference: string | null;
  standard_piece_weight_g: number | null;
  fiber_g: number | null;
  sugars_g: number | null;
  sodium_mg: number | null;
  saturated_fat_g: number | null;
  cholesterol_mg: number | null;
  potassium_mg: number | null;
  nutrition_extended: number | null;
  /** Colonne SQL `date` (ex. "2025-01-15") */
  deleted_at: string | null;
};
