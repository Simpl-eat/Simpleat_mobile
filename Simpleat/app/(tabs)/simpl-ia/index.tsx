import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createConversation,
  listConversations,
  sortConversationsByDateDesc,
} from '@/lib/chat-api';
import type { Conversation } from '@/lib/types';

function formatConversationDate(iso: string): string {
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return '';
  return new Date(d).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function SimplIaConversationsScreen() {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadList = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const list = sortConversationsByDateDesc(await listConversations());
      setConversations(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les conversations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadList();
    }, [loadList])
  );

  const handleNewChat = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    try {
      const created = await createConversation();
      router.push(`/(tabs)/simpl-ia/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Création de la conversation impossible.');
    } finally {
      setIsCreating(false);
    }
  }, []);

  return (
    <ImageBackground
      source={require('@/assets/images/fond_picto_all.png')}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <View style={[styles.container, { paddingTop: Math.max(0, insets.top) }]}>
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

        <View style={styles.card}>
          <View style={styles.toolbar}>
            <Text style={styles.sectionTitle}>Tes conversations</Text>
            <Pressable
              style={[styles.newButton, isCreating && styles.newButtonDisabled]}
              onPress={() => void handleNewChat()}
              disabled={isCreating}
              accessibilityRole="button"
              accessibilityLabel="Nouvelle conversation avec BrocoChef"
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.newButtonLabel}>Nouveau chat</Text>
                </>
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isLoading ? (
            <View style={styles.loaderWrapper}>
              <ActivityIndicator size="large" color="#496943" />
              <Text style={styles.statusText}>Chargement…</Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={
                conversations.length === 0 ? styles.emptyList : styles.listContent
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Parle cuisine avec BrocoChef</Text>
                  <Text style={styles.emptySubtitle}>
                    Crée une conversation pour poser tes questions du quotidien.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => router.push(`/(tabs)/simpl-ia/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Conversation du ${formatConversationDate(item.date)}`}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#496943" />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>BrocoChef</Text>
                    <Text style={styles.rowMeta}>{formatConversationDate(item.date)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
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
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#496943',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#496943',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
  },
  newButtonDisabled: {
    opacity: 0.6,
  },
  newButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
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
  listContent: {
    paddingBottom: 8,
    gap: 8,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#496943',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(247, 243, 234, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  rowMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
