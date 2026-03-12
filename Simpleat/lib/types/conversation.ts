/**
 * Table: public.conversation
 */
export type Conversation = {
  id: number;
  date: string; // ISO timestamp with time zone
  user_id: string; // uuid
  deleted_at: string | null; // ISO timestamp with time zone
};
