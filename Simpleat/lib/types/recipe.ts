/**
 * Table: public.recipe
 * Colonnes renvoyées en minuscules par Postgres (ex: vegetarian, lunch_type, ia_genereted).
 */
export type Recipe = {
  id: number;
  name: string;
  description: string | null;
  note: number | null;
  deleted_at: string | null; // ISO timestamp with time zone
  preparation_time: string | null; // interval (ex: "00:30:00")
  cook_time: string | null;
  total_time: string | null;
  step: string;
  vegetarian: boolean;
  vegan: boolean;
  keto: boolean;
  dukan: boolean;
  mediterranean: boolean;
  carnivore: boolean;
  lunch_type: string;
  ia_genereted: boolean | null;
};
