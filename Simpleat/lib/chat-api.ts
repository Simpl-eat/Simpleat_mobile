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

const baseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, '');

function buildUrl(path: string): string {
  if (!baseUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL (ou EXPO_PUBLIC_BACKEND_URL) est manquant dans le .env mobile.'
    );
  }
  return `${baseUrl}${path}`;
}

/** Retire BOM / espaces ; certains serveurs renvoient du texte autour du JSON. */
function parseJsonResponseBody(text: string): Record<string, unknown> | null {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const looksLikeHtml = trimmed.startsWith('<') || /<html[\s>]/i.test(trimmed);
    const hint = looksLikeHtml
      ? ' (le serveur a renvoyé du HTML, souvent une page d’erreur Next.js ou un proxy).'
      : '';
    const preview = trimmed.length > 180 ? `${trimmed.slice(0, 180)}…` : trimmed;
    throw new Error(
      `Réponse HTTP non JSON${hint} — extrait : ${preview.replace(/\s+/g, ' ')}`
    );
  }
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
  const payload = text ? parseJsonResponseBody(text) : null;

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
  const token = await getAccessToken();
  const response = await fetch(buildUrl(`/api/conversations/${conversationId}/messages`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  const text = await response.text();
  let payload: Record<string, unknown> | null = null;
  try {
    payload = text ? parseJsonResponseBody(text) : null;
  } catch (parseError) {
    const ct = response.headers.get('content-type') ?? '';
    const base =
      parseError instanceof Error
        ? parseError.message
        : 'Réponse du serveur illisible. Réessaie dans un instant.';
    throw new Error(
      `[HTTP ${response.status}${ct ? `, ${ct}` : ''}] ${base}`
    );
  }

  if (response.status === 201) {
    return {
      userMessage: payload?.userMessage as ChatBotMessage,
      iaMessage: payload?.iaMessage as ChatBotMessage | undefined,
    };
  }

  if (response.status === 502) {
    const userMessage = payload?.userMessage as ChatBotMessage | undefined;
    const err =
      typeof payload?.error === 'string'
        ? payload.error
        : "BrocoChef n'a pas pu répondre. Vérifie que le service IA (LM Studio) est démarré côté serveur.";
    if (!userMessage) {
      throw new Error(err);
    }
    return { userMessage, error: err };
  }

  const apiMessage =
    payload && typeof payload.error === 'string'
      ? payload.error
      : `Erreur API ${response.status}`;
  throw new Error(apiMessage);
}

export async function getOrCreateLatestConversation(): Promise<Conversation> {
  const conversations = sortConversationsByDateDesc(await listConversations());
  if (conversations.length > 0) {
    return conversations[0]!;
  }
  return createConversation();
}

/** Plus récent en premier (champ `date` de la table conversation). */
export function sortConversationsByDateDesc(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const ta = Date.parse(a.date);
    const tb = Date.parse(b.date);
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

export function isSender(value: string): value is Sender {
  return value === 'user' || value === 'ia';
}
