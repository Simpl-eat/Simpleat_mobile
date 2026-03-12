import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRecipe } from '@/hooks/useRecipe';

/** Découpe le champ step (texte) en lignes pour l’affichage. */
function formatStepLines(step: string): string[] {
  if (!step.trim()) return [];
  return step.split('\n').filter(Boolean);
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const { recipe, error, isLoading, refetch } = useRecipe(id);

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  // Optionnel : mettre à jour le titre du header avec le nom de la recette
  useEffect(() => {
    if (recipe?.name) {
      navigation.setOptions({ title: recipe.name });
    }
  }, [recipe?.name, navigation]);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Chargement de la recette…</ThemedText>
      </ThemedView>
    );
  }

  if (error || !recipe) {
    const message = error?.message ?? 'Cette recette n’existe pas ou a été supprimée.';
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Recette introuvable</ThemedText>
        <ThemedText style={styles.errorText}>{message}</ThemedText>
        {id != null && (
          <ThemedText style={styles.debugId}>
            ID demandé : {Array.isArray(id) ? id.join(', ') : id}
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  const stepLines = formatStepLines(recipe.step);
  const timeLabel = [recipe.preparation_time, recipe.cook_time, recipe.total_time]
    .filter(Boolean)
    .join(' • ') || null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.body}>
        {timeLabel ? (
          <ThemedText style={styles.meta}>⏱ {timeLabel}</ThemedText>
        ) : null}

        {recipe.description ? (
          <ThemedText style={styles.description}>{recipe.description}</ThemedText>
        ) : null}

        {stepLines.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Préparation
            </ThemedText>
            {stepLines.map((line, i) => (
              <ThemedText key={i} style={styles.step}>
                {i + 1}. {line}
              </ThemedText>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  debugId: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.7,
  },
  body: {
    padding: 16,
  },
  meta: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    marginTop: 8,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  step: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
});
