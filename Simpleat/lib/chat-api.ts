import { supabase } from '@/lib/supabase';
import type { ChatBotMessage, Conversation } from '@/lib/types';

type Sender = 'user' | 'ia';

type ConversationWithMessages = Conversation & {
  messages: ChatBotMessage[];
};

type SendMessageResponse = {
  userMessage: ChatBotMessage;
  iaMessage?: ChatBotMessage;
  error?: string;
};

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

function buildUrl(path: string): string {
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL est manquant dans le .env mobile.');
  }
  return `${baseUrl}${path}`;
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) {
    throw new Error('Session utilisateur introuvable. Reconnecte-toi puis réessaie.');
  }

  return token;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : null;

  if (!response.ok) {
    const apiMessage =
      payload && typeof payload.error === 'string' ? payload.error : `Erreur API ${response.status}`;
    throw new Error(apiMessage);
  }

  return payload as T;
}

export async function listConversations(): Promise<Conversation[]> {
  return apiRequest<Conversation[]>('/api/conversations', { method: 'GET' });
}

export async function createConversation(): Promise<Conversation> {
  return apiRequest<Conversation>('/api/conversations', { method: 'POST' });
}

export async function getConversation(conversationId: number): Promise<ConversationWithMessages> {
  return apiRequest<ConversationWithMessages>(`/api/conversations/${conversationId}`, {
    method: 'GET',
  });
}

export async function sendConversationMessage(
  conversationId: number,
  message: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function getOrCreateLatestConversation(): Promise<Conversation> {
  const conversations = await listConversations();
  if (conversations.length > 0) {
    return conversations[0]!;
  }
  return createConversation();
}

export function isSender(value: string): value is Sender {
  return value === 'user' || value === 'ia';
}
