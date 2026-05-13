import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  getOrCreateLatestConversation,
  isSender,
  sendConversationMessage,
} from '@/lib/chat-api';
import type { ChatBotMessage } from '@/lib/types';

export default function SimpliaScreen() {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatBotMessage[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversation = useCallback(async () => {
    setIsBootstrapping(true);
    setError(null);
    try {
      const latestConversation = await getOrCreateLatestConversation();
      setConversationId(latestConversation.id);
      const conversation = await getConversation(latestConversation.id);
      const validMessages = conversation.messages.filter((message) => isSender(message.sender));
      setMessages(validMessages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la conversation.');
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  const canSend = useMemo(() => {
    return Boolean(inputText.trim()) && !isSending && !isBootstrapping && conversationId !== null;
  }, [conversationId, inputText, isBootstrapping, isSending]);

  const handleSendMessage = useCallback(async () => {
    const content = inputText.trim();
    if (!content || !conversationId || isSending) {
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
    setInputText('');
    setIsSending(true);
    setMessages((current) => [...current, optimisticMessage]);

    try {
      const response = await sendConversationMessage(conversationId, content);

      setMessages((current) =>
        current.map((message) => (message.id === optimisticMessage.id ? response.userMessage : message))
      );

      if (response.iaMessage && isSender(response.iaMessage.sender)) {
        setMessages((current) => [...current, response.iaMessage as ChatBotMessage]);
      }

      if (response.error) {
        setError(response.error);
      }
    } catch (sendError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
      setError(sendError instanceof Error ? sendError.message : "L'envoi du message a échoué.");
    } finally {
      setIsSending(false);
    }
  }, [conversationId, inputText, isSending]);

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
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
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

        {/* --- CARTE PRINCIPALE --- */}
        <View style={styles.card}>
          {isBootstrapping ? (
            <View style={styles.loaderWrapper}>
              <ActivityIndicator size="large" color="#496943" />
              <Text style={styles.statusText}>Chargement de votre conversation...</Text>
            </View>
          ) : messages.length === 0 ? (
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
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((message) => {
                const fromAssistant = message.sender === 'ia';
                return (
                  <View
                    key={`${message.id}-${message.time}`}
                    style={[styles.bubble, fromAssistant ? styles.bubbleAssistant : styles.bubbleUser]}
                  >
                    <Text style={[styles.bubbleText, fromAssistant ? styles.bubbleTextAssistant : styles.bubbleTextUser]}>
                      {message.message}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Zone de saisie (Input) */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Je veux cuisiner du chou-fleur"
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              editable={!isBootstrapping && !isSending}
            />
            <Pressable
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              disabled={!canSend}
              onPress={handleSendMessage}
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
  
  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    marginBottom: 10,
  },
  mascotHeader: {
    width: 70,
    height: 70,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // CARD
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

  // CONTENU CENTRAL
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

  // INPUT
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