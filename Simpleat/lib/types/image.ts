/**
 * Table: public.image
 */
export type Image = {
  id: number;
  link: string;
  recipe_id: number;
  deleted_at: string | null; // ISO timestamp with time zone
};
