/**
 * Table: public.planningUser
 */
export type PlanningUser = {
  id: number;
  plannification_date: string; // date (YYYY-MM-DD)
  user_id: string; // uuid
  recipe_id: number;
  deleted_at: string | null; // ISO timestamp with time zone
};
