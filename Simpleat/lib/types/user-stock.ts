/**
 * Table: public.userStock
 */
export type UserStock = {
  id: number;
  quantity: number;
  user_id: string; // uuid
  ingredient_id: number;
  deleted_at: string | null; // ISO timestamp with time zone
};
