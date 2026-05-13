import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getConversation,
  isSender,
  sendConversationMessage,
} from '@/lib/chat-api';
import type { ChatBotMessage } from '@/lib/types';

export default function SimpliaConversationScreen() {
  const insets = useSafeAreaInsets();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const conversationIdParam = Array.isArray(rawId) ? rawId[0] : rawId;
  const conversationId = conversationIdParam ? Number(conversationIdParam) : NaN;

  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatBotMessage[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iaFailureMessage, setIaFailureMessage] = useState<string | null>(null);
  const [retryText, setRetryText] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const loadConversation = useCallback(async () => {
    if (!Number.isFinite(conversationId) || conversationId < 1) {
      setError('Conversation invalide.');
      setIsBootstrapping(false);
      return;
    }
    setIsBootstrapping(true);
    setError(null);
    try {
      const conversation = await getConversation(conversationId);
      const validMessages = conversation.messages.filter((message) =>
        isSender(message.sender)
      );
      setMessages(validMessages);
      setIaFailureMessage(null);
      setRetryText(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Conversation introuvable.');
      setMessages([]);
    } finally {
      setIsBootstrapping(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const canSend = useMemo(() => {
    return (
      Boolean(inputText.trim()) &&
      !isSending &&
      !isBootstrapping &&
      Number.isFinite(conversationId) &&
      conversationId >= 1
    );
  }, [conversationId, inputText, isBootstrapping, isSending]);

  const applySendResponse = useCallback(
    (response: Awaited<ReturnType<typeof sendConversationMessage>>) => {
      setMessages((current) =>
        current.map((message) =>
          message.id < 0 && message.sender === 'user' ? response.userMessage : message
        )
      );
      if (response.iaMessage && isSender(response.iaMessage.sender)) {
        setMessages((current) => [...current, response.iaMessage as ChatBotMessage]);
      }
      if (response.error) {
        setIaFailureMessage(response.error);
        setRetryText(response.userMessage.message);
      } else {
        setIaFailureMessage(null);
        setRetryText(null);
      }
    },
    []
  );

  const handleSendMessage = useCallback(async () => {
    const content = inputText.trim();
    if (!content || !Number.isFinite(conversationId) || conversationId < 1 || isSending) {
      return;
    }

    const optimisticMessage: ChatBotMessage = {
      id: -Date.now(),
      conversation_id: conversationId,
      sender: 'user',
      message: content,
      time: new Date().toISOString(),
      deleted_at: null,
    };

    setError(null);
    setIaFailureMessage(null);
    setRetryText(null);
    setInputText('');
    setIsSending(true);
    setMessages((current) => [...current, optimisticMessage]);

    try {
      const response = await sendConversationMessage(conversationId, content);
      applySendResponse(response);
    } catch (sendError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
      setError(
        sendError instanceof Error ? sendError.message : "L'envoi du message a échoué."
      );
    } finally {
      setIsSending(false);
    }
  }, [applySendResponse, conversationId, inputText, isSending]);

  const handleRetryIa = useCallback(async () => {
    if (!retryText || !Number.isFinite(conversationId) || conversationId < 1 || isSending) {
      return;
    }
    setError(null);
    setIaFailureMessage(null);
    setIsSending(true);
    try {
      const response = await sendConversationMessage(conversationId, retryText);
      setMessages((current) => {
        const next = [...current];
        const lastIdx = next.length - 1;
        if (
          lastIdx >= 0 &&
          next[lastIdx]?.sender === 'user' &&
          next[lastIdx]?.message === retryText
        ) {
          next[lastIdx] = response.userMessage;
        }
        if (response.iaMessage && isSender(response.iaMessage.sender)) {
          next.push(response.iaMessage);
        }
        return next;
      });
      if (response.error) {
        setIaFailureMessage(response.error);
      } else {
        setRetryText(null);
      }
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "La nouvelle tentative a échoué."
      );
      setIaFailureMessage(
        "BrocoChef n'a toujours pas répondu. Tu peux réessayer dans un instant."
      );
    } finally {
      setIsSending(false);
    }
  }, [conversationId, isSending, retryText]);

  if (!Number.isFinite(conversationId) || conversationId < 1) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Identifiant de conversation invalide.</Text>
        <Pressable
          onPress={() => router.replace('/(tabs)/simpl-ia')}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Retour à la liste des conversations"
        >
          <Text style={styles.retryButtonLabel}>Retour à la liste</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('@/assets/images/fond_picto_all.png')}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: Math.max(0, insets.top) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Retour à la liste des conversations"
          >
            <Ionicons name="arrow-back" size={26} color="#496943" />
          </Pressable>
          <Image
            source={require('@/assets/images/broco_cooking.png')}
            style={styles.mascotHeader}
            resizeMode="contain"
          />
          <View style={styles.titleRow}>
            <Text style={styles.titleDark}>Simpl&apos;</Text>
            <Text style={styles.titleHighlight}>IA</Text>
          </View>
        </View>

        <View style={styles.card}>
          {isBootstrapping ? (
            <View style={styles.loaderWrapper}>
              <ActivityIndicator size="large" color="#496943" />
              <Text style={styles.statusText}>Chargement de la conversation…</Text>
            </View>
          ) : messages.length === 0 && !error ? (
            <View style={styles.contentCenter}>
              <Text style={styles.greetingText}>
                Comment puis-je vous{'\n'}aider aujourd&apos;hui ?
              </Text>
              <Image
                source={require('@/assets/images/broco_waving.png')}
                style={styles.mascotCenter}
                resizeMode="contain"
              />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={scrollToBottom}
            >
              {messages.map((message) => {
                const fromAssistant = message.sender === 'ia';
                return (
                  <View
                    key={`${message.id}-${message.time}`}
                    style={[
                      styles.bubble,
                      fromAssistant ? styles.bubbleAssistant : styles.bubbleUser,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        fromAssistant ? styles.bubbleTextAssistant : styles.bubbleTextUser,
                      ]}
                    >
                      {message.message}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {error ? (
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          {iaFailureMessage ? (
            <View style={styles.iaFailBanner} accessibilityLiveRegion="polite">
              <Text style={styles.iaFailText}>{iaFailureMessage}</Text>
              <Pressable
                style={[styles.retryButton, isSending && styles.retryButtonDisabled]}
                onPress={() => void handleRetryIa()}
                disabled={isSending || !retryText}
                accessibilityRole="button"
                accessibilityLabel="Réessayer une réponse de BrocoChef"
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.retryButtonLabel}>Réessayer</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Je veux cuisiner du chou-fleur"
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              editable={!isBootstrapping && !isSending}
              accessibilityLabel="Message pour BrocoChef"
            />
            <Pressable
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              disabled={!canSend}
              onPress={() => void handleSendMessage()}
              accessibilityRole="button"
              accessibilityLabel="Envoyer le message"
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="paper-plane" size={20} color="#FFFFFF" style={styles.sendIcon} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7F3EA',
    gap: 16,
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: '#F7F3EA',
  },
  backgroundImageStyle: {
    opacity: 0.15,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  mascotHeader: {
    width: 70,
    height: 70,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleDark: {
    fontSize: 34,
    fontWeight: '600',
    color: '#496943',
  },
  titleHighlight: {
    fontSize: 34,
    fontWeight: '600',
    color: '#F9AB24',
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    justifyContent: 'space-between',
  },
  contentCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#496943',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 40,
  },
  mascotCenter: {
    width: 120,
    height: 120,
  },
  loaderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusText: {
    color: '#496943',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
    gap: 10,
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#496943',
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7F3EA',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTextAssistant: {
    color: '#1F2937',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  iaFailBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  iaFailText: {
    color: '#92400E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#496943',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F3EA',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#496943',
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#496943',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    marginLeft: -2,
  },
});
