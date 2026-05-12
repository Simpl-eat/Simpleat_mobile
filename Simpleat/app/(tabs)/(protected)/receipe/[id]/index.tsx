import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRecipe } from "@/hooks/useRecipe";
import { useRecipePreference } from "@/hooks/useRecipePreference";

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

  const recipeId = Array.isArray(id) ? id[0] : id;

  const { recipe, error, isLoading, refetch } = useRecipe(recipeId);
  const { preference, setPreference, removePreference } =
    useRecipePreference(recipeId);

  const isLiked = preference === true;
  const isDisliked = preference === false;

  // URL image depuis bucket Supabase
  const imageUrl = recipeId
    ? supabase.storage.from("img-recette").getPublicUrl(`${recipeId}.jpg`).data
        .publicUrl
    : "https://via.placeholder.com/400x300";

  // Couleurs dynamiques => contraste des macros
  const nutritionItems = useMemo(
    () => [
      { label: "lipides", value: "--g", bg: "#F5D90A", text: "#111111" },
      { label: "protéines", value: "--g", bg: "#FF6D6D", text: "#FFFFFF" },
      { label: "glucides", value: "--g", bg: "#F9AB24", text: "#111111" },
      { label: "fibres", value: "--g", bg: "#3F6E3C", text: "#FFFFFF" },
    ],
    [],
  );

  const handleToggleLike = async () => {
    isLiked ? await removePreference() : await setPreference(true);
  };

  const handleToggleDislike = async () => {
    isDisliked ? await removePreference() : await setPreference(false);
  };

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#4F7343" />
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* SECTION HAUT : FOND + IMAGE + BOUTONS */}
      <ImageBackground
        source={require("@/assets/images/fond_picto_general.png")}
        style={styles.heroContainer}
        imageStyle={styles.topPictoImage}
      >
        <View style={styles.hero}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />

          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#496943" />
          </Pressable>

          {/* BOUTON LIKE HAUT DROITE */}
          <Pressable onPress={handleToggleLike} style={styles.topLikeButton}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#FF6D6D" : "#555555"}
            />
          </Pressable>
        </View>
      </ImageBackground>

      {/* CARTE VERTE */}
      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          {recipe?.name_fr ?? "Recette"}
        </ThemedText>

        <View style={styles.nutritionRow}>
          {nutritionItems.map((item) => (
            <View
              key={item.label}
              style={[styles.nutritionBubble, { backgroundColor: item.bg }]}
            >
              <ThemedText style={[styles.nutritionValue, { color: item.text }]}>
                {item.value}
              </ThemedText>
              <ThemedText style={[styles.nutritionLabel, { color: item.text }]}>
                {item.label}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Ingrédients
          </ThemedText>
          {formatDescriptionLines(recipe?.description_fr || "").map(
            (line, i) => (
              <ThemedText key={i} style={styles.ingredient}>
                {line}
              </ThemedText>
            ),
          )}
        </View>

        <View style={styles.sectionBlock}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Préparation
          </ThemedText>
          {formatStepLines(recipe?.step_fr || "").map((line, i) => (
            <ThemedText key={i} style={styles.step}>
              {i + 1}. {line}
            </ThemedText>
          ))}
        </View>

        <View style={styles.bonAppetitContainer}>
          <Image
            source={require("@/assets/images/broco_tasting.png")}
            style={styles.mascotImage}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.bonAppetitText}>
            Bon appétit !
          </ThemedText>
        </View>
      </View>

      {/* SECTION BAS : FOND + FEEDBACK OUI/NON */}
      <ImageBackground
        source={require("@/assets/images/fond_picto.png")}
        style={styles.bottomSectionContainer}
        imageStyle={styles.bottomPictoImage}
      >
        <View style={styles.feedbackContainer}>
          <ThemedText style={styles.feedbackTitle}>
            Cette recette vous a plu ?
          </ThemedText>
          <View style={styles.feedbackButtons}>
            <Pressable
              style={[styles.btnAction, isDisliked && styles.btnActionActive]}
              onPress={handleToggleDislike}
            >
              <ThemedText style={styles.btnText}>Non.</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.btnAction, isLiked && styles.btnActionActive]}
              onPress={handleToggleLike}
            >
              <Ionicons
                name="heart"
                size={20}
                color={isLiked ? "#D14848" : "#FF6D6D"}
                style={{ marginRight: 6 }}
              />
              <ThemedText
                style={[styles.btnText, isLiked && { color: "#D14848" }]}
              >
                Oui !
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flexGrow: 1, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  heroContainer: { width: "100%" },
  topPictoImage: { opacity: 0.5, resizeMode: "cover" },
  hero: { height: 320, paddingTop: 50, paddingHorizontal: 16 },
  heroImage: {
    width: "100%",
    height: 250,
    borderRadius: 24,
    resizeMode: "cover",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(229, 231, 211, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 65,
    left: 28,
    zIndex: 10,
  },
  topLikeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 65,
    right: 28,
    zIndex: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    backgroundColor: "#496943",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -40,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    zIndex: 5,
  },
  title: { color: "#FFFFFF", marginBottom: 20, fontSize: 26 },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  nutritionBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  nutritionValue: { fontSize: 17, fontWeight: "800" },
  nutritionLabel: { fontSize: 10, fontWeight: "600" },
  sectionTitle: { color: "#FFFFFF", marginBottom: 12, fontSize: 19 },
  sectionBlock: { marginBottom: 24 },
  ingredient: { color: "#F2F8EF", fontSize: 15, marginBottom: 4 },
  step: { fontSize: 15, marginBottom: 12, color: "#F2F8EF" },
  bonAppetitContainer: { alignItems: "center", marginTop: 20 },
  mascotImage: { width: 80, height: 80, marginBottom: 8 },
  bonAppetitText: { color: "#FFFFFF", fontSize: 24, fontWeight: "bold" },
  bottomSectionContainer: {
    width: "100%",
    minHeight: 180,
    marginTop: -30,
    paddingTop: 50,
  },
  bottomPictoImage: { opacity: 0.5, resizeMode: "cover" },
  feedbackContainer: { alignItems: "center" },
  feedbackTitle: { fontSize: 19, fontWeight: "700", marginBottom: 16 },
  feedbackButtons: { flexDirection: "row", gap: 16 },
  btnAction: {
    backgroundColor: "#EBE9DF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
    minWidth: 110,
    justifyContent: "center",
  },
  btnActionActive: { backgroundColor: "#D6D3C0" },
  btnText: { color: "#111111", fontWeight: "700", fontSize: 17 },
});
