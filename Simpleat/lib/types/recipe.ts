/**
 * Table: public.recipe
 * Colonnes alignées sur Postgres (noms en snake_case côté client Supabase).
 */
export type Recipe = {
  id: number;
  name: string;
  note: number | null;
  description: string | null;
  step: string;
  image: string | null;
  str_category_fr: string | null;
  str_area_fr: string | null;
  name_fr: string | null;
  description_fr: string | null;
  step_fr: string;
  /** interval Postgres → chaîne côté client */
  preparation_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  vegetarian: boolean | null;
  vegan: boolean | null;
  keto: boolean | null;
  dukan: boolean | null;
  mediterranean: boolean | null;
  carnivore: boolean | null;
  lunch_type: string | null;
  /** Colonne SQL `date` */
  deleted_at: string | null;
};
