import { useMemo } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRecipes } from '@/hooks/useRecipes';

export default function RecipesDebugScreen() {
  const { recipes, error, isLoading, refetch } = useRecipes();

  const countLabel = useMemo(() => {
    if (!recipes) return 'Aucune recette chargee';
    return `${recipes.length} recette(s) chargee(s)`;
  }, [recipes]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Test Supabase - recettes</ThemedText>
        <ThemedText style={styles.meta}>{countLabel}</ThemedText>
      </View>

      <View style={styles.actions}>
        <Button title="Refetch" onPress={refetch} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.info}>Chargement...</ThemedText>
        </View>
      ) : null}

      {error ? (
        <View style={styles.card}>
          <ThemedText type="subtitle">Erreur</ThemedText>
          <ThemedText>{error.message}</ThemedText>
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView contentContainerStyle={styles.list}>
          {(recipes ?? []).map((recipe) => (
            <View key={recipe.id} style={styles.card}>
              <ThemedText type="subtitle">{recipe.name ?? 'Sans nom'}</ThemedText>
              <ThemedText>ID: {recipe.id}</ThemedText>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 12,
    gap: 4,
  },
  meta: {
    opacity: 0.7,
  },
  actions: {
    marginBottom: 12,
  },
  centered: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  info: {
    opacity: 0.8,
  },
  list: {
    gap: 8,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
});
