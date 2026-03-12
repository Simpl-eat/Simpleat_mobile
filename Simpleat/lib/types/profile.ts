/**
 * Table: public.profile
 */
export type Profile = {
  id: number;
  pseudo: string;
  role: string; // USER-DEFINED enum
  diet: string; // USER-DEFINED enum
  goal: string; // USER-DEFINED enum
  allergy: string | null;
  desire: string | null;
  user_id: string; // uuid
  deleted_at: string | null; // ISO timestamp with time zone
};
