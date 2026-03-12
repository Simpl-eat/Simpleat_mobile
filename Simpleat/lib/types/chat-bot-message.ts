/**
 * Table: public.chatBotMessage
 */
export type ChatBotMessage = {
  id: number;
  message: string;
  time: string; // ISO timestamp with time zone
  sender: string; // USER-DEFINED enum
  conversation_id: number;
  deleted_at: string | null; // ISO timestamp with time zone
};
