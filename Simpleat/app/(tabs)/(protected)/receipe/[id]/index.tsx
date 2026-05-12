import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRecipe } from "@/hooks/useRecipe";

/** Découpe le champ step (texte) en lignes pour l’affichage. */
function formatStepLines(step: string): string[] {
  if (!step.trim()) return [];
  return step.split("\n").filter(Boolean);
}

function formatDescriptionLines(description: string | null): string[] {
  if (!description?.trim()) return [];
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { recipe, error, isLoading, refetch } = useRecipe(
    Array.isArray(id) ? id[0] : id,
  );

  const nutritionItems = useMemo(
    () => [
      { label: "lipides", value: "--g", color: "#F5D90A" },
      { label: "proteines", value: "--g", color: "#FF6D6D" },
      { label: "glucides", value: "--g", color: "#F9AB24" },
      { label: "fibres", value: "--g", color: "#3F6E3C" },
    ],
    [],
  );

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>
          Chargement de la recette…
        </ThemedText>
      </ThemedView>
    );
  }

  if (error || !recipe) {
    const message =
      error?.message ?? "Cette recette n’existe pas ou a été supprimée.";
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Recette introuvable</ThemedText>
        <ThemedText style={styles.errorText}>{message}</ThemedText>
        {id != null && (
          <ThemedText style={styles.debugId}>
            ID demandé : {Array.isArray(id) ? id.join(", ") : id}
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  const stepLines = formatStepLines(recipe.step_fr);
  const ingredientLines = formatDescriptionLines(recipe.description_fr);
  const timeLabel =
    ["Préparation", "Cuisson", "Temps total"]
      .map(
        (label, index) =>
          [label, recipe.preparation_time, recipe.cook_time, recipe.total_time][
            index
          ],
      )
      .filter(Boolean)
      .join(" • ") || null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.hero}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>←</ThemedText>
        </Pressable>
      </View>

      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          {recipe.name_fr ?? "Recette"}
        </ThemedText>

        <View style={styles.nutritionRow}>
          {nutritionItems.map((item) => (
            <View
              key={item.label}
              style={[styles.nutritionBubble, { backgroundColor: item.color }]}
            >
              <ThemedText style={styles.nutritionValue}>
                {item.value}
              </ThemedText>
              <ThemedText style={styles.nutritionLabel}>
                {item.label}
              </ThemedText>
            </View>
          ))}
        </View>

        {timeLabel ? (
          <ThemedText style={styles.meta}>Temps: {timeLabel}</ThemedText>
        ) : null}

        <View style={styles.sectionBlock}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Description
          </ThemedText>
          {ingredientLines.length > 0 ? (
            ingredientLines.map((line, i) => (
              <ThemedText key={`${line}-${i}`} style={styles.ingredient}>
                {line}
              </ThemedText>
            ))
          ) : (
            <ThemedText style={styles.placeholderText}>
              La description sera ajoutée bientôt.
            </ThemedText>
          )}
        </View>

        <View style={styles.sectionBlock}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Préparation
          </ThemedText>
          {stepLines.length > 0 ? (
            stepLines.map((line, i) => (
              <ThemedText key={`${line}-${i}`} style={styles.step}>
                {i + 1}. {line}
              </ThemedText>
            ))
          ) : (
            <ThemedText style={styles.placeholderText}>
              Les étapes de préparation seront ajoutées bientôt.
            </ThemedText>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F3EA",
  },
  content: {
    paddingBottom: 44,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 8,
    textAlign: "center",
  },
  debugId: {
    marginTop: 12,
    fontSize: 12,
    opacity: 0.7,
  },
  hero: {
    height: 190,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: "flex-start",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E5E7D3",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 24,
    lineHeight: 24,
    color: "#496943",
  },
  card: {
    backgroundColor: "#4F7343",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    minHeight: 460,
  },
  title: {
    color: "#FFFFFF",
    marginBottom: 14,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  nutritionBubble: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
    lineHeight: 26,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#111111",
  },
  meta: {
    fontSize: 14,
    marginBottom: 18,
    color: "#EAF4E2",
  },
  sectionTitle: {
    color: "#FFFFFF",
    marginBottom: 10,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  ingredient: {
    color: "#F2F8EF",
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 2,
  },
  step: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
    color: "#F2F8EF",
  },
  placeholderText: {
    fontSize: 14,
    color: "#EAF4E2",
    opacity: 0.9,
  },
});
