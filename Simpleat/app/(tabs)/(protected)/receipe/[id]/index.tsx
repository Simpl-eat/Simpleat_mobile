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

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const recipeId = Array.isArray(id) ? id[0] : id;

  // On suppose que "ingredients" est maintenant renvoyé par useRecipe (voir étape 2)
  const { recipe, ingredients, macros, error, isLoading, refetch } = useRecipe(recipeId);
  const { preference, setPreference, removePreference } = useRecipePreference(recipeId);

  const isLiked = preference === true;
  const isDisliked = preference === false;

  // URL image depuis bucket Supabase
  const imageUrl = recipeId
    ? supabase.storage.from("img-recette").getPublicUrl(`${recipeId}.jpg`).data.publicUrl
    : "https://via.placeholder.com/400x300";

  const fmt = (val: number | undefined) =>
    val != null && val > 0 ? `${Math.round(val)}g` : "--g";

  const nutritionItems = useMemo(
    () => [
      { label: "lipides", value: fmt(macros?.fat), bg: "#F5D90A", text: "#111111" },
      { label: "protéines", value: fmt(macros?.protein), bg: "#FF6D6D", text: "#FFFFFF" },
      { label: "glucides", value: fmt(macros?.carbohydrates), bg: "#F9AB24", text: "#111111" },
      { label: "fibres", value: fmt(macros?.fiber), bg: "#3F6E3C", text: "#FFFFFF" },
    ],
    [macros],
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
    <View style={styles.screen}>
      
      {/* BOUTONS FLOTTANTS (Toujours visibles, par-dessus le ScrollView) */}
      <View style={styles.floatingHeader}>
        <Pressable onPress={() => router.back()} style={styles.floatingBtn}>
          <Ionicons name="arrow-back" size={24} color="#496943" />
        </Pressable>

        <Pressable onPress={handleToggleLike} style={styles.floatingBtn}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#FF6D6D" : "#555555"}
          />
        </Pressable>
      </View>

      {/* CONTENU SCROLLABLE */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* SECTION IMAGE */}
        <ImageBackground
          source={require("@/assets/images/fond_picto_general.png")}
          style={styles.heroContainer}
          imageStyle={styles.topPictoImage}
        >
          <View style={styles.hero}>
            <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          </View>
        </ImageBackground>

        {/* CARTE VERTE */}
        <View style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            {recipe?.name_fr ?? "Recette"}
          </ThemedText>

          <View style={styles.nutritionRow}>
            {nutritionItems.map((item) => (
              <View key={item.label} style={[styles.nutritionBubble, { backgroundColor: item.bg }]}>
                <ThemedText style={[styles.nutritionValue, { color: item.text }]}>{item.value}</ThemedText>
                <ThemedText style={[styles.nutritionLabel, { color: item.text }]}>{item.label}</ThemedText>
              </View>
            ))}
          </View>

          {/* SECTION INGRÉDIENTS (Vraies données de la table recipeIngredient) */}
          <View style={styles.sectionBlock}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Ingrédients</ThemedText>
            {ingredients && ingredients.length > 0 ? (
              ingredients.map((ing: any, i: number) => {
                // Vérification : on n'affiche l'unité que si elle est différente de la quantité
                // et qu'elle n'est pas juste un "1" générique.
                const unitToDisplay = 
                  ing.unit_fr && 
                  String(ing.unit_fr).trim() !== String(ing.quantity).trim() && 
                  ing.unit_fr !== "1"
                    ? ing.unit_fr
                    : "";

                return (
                  <View key={i} style={styles.ingredientRow}>
                    <View style={styles.ingredientDot} />
                    <ThemedText style={styles.ingredientText}>
                      <ThemedText style={styles.ingredientQuantity}>
                        {ing.quantity} {unitToDisplay}{" "}
                      </ThemedText>
                      {ing.name_fr}
                    </ThemedText>
                  </View>
                );
              })
            ) : (
              <ThemedText style={styles.ingredientText}>Aucun ingrédient renseigné.</ThemedText>
            )}
          </View>

          {/* SECTION ÉTAPES DE PRÉPARATION (Stylisée avec badges) */}
          <View style={styles.sectionBlock}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Préparation</ThemedText>
            {formatStepLines(recipe?.step_fr || "").map((line, i) => (
              <View key={i} style={styles.stepRow}>
                {/* Badge coloré pour le numéro */}
                <View style={styles.stepBadge}>
                  <ThemedText style={styles.stepBadgeText}>{i + 1}</ThemedText>
                </View>
                <ThemedText style={styles.stepText}>{line}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.bonAppetitContainer}>
            <Image
              source={require("@/assets/images/broco_tasting.png")}
              style={styles.mascotImage}
              resizeMode="contain"
            />
            <ThemedText type="title" style={styles.bonAppetitText}>Bon appétit !</ThemedText>
          </View>
        </View>

        {/* SECTION BAS : FEEDBACK OUI/NON */}
        <ImageBackground
          source={require("@/assets/images/fond_picto.png")}
          style={styles.bottomSectionContainer}
          imageStyle={styles.bottomPictoImage}
        >
          <View style={styles.feedbackContainer}>
            {/* Texte forcé en Noir */}
            <ThemedText style={styles.feedbackTitle}>Cette recette vous a plu ?</ThemedText>
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
                <ThemedText style={[styles.btnText, isLiked && { color: "#D14848" }]}>Oui !</ThemedText>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flexGrow: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* --- BOUTONS FLOTTANTS --- */
  floatingHeader: {
    position: 'absolute',
    top: 50, // Ajuste selon ton Safe Area (encoche iPhone)
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100, // Passe par dessus tout
  },
  floatingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  /* --- HAUT DE PAGE --- */
  heroContainer: { width: "100%" },
  topPictoImage: { opacity: 0.5, resizeMode: "cover" },
  hero: { height: 300, paddingTop: 40, paddingHorizontal: 16 }, // Padding réduit car plus de boutons dedans
  heroImage: { width: "100%", height: 260, borderRadius: 24, resizeMode: "cover" },

  /* --- CARTE VERTE --- */
  card: {
    backgroundColor: "#496943",
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40,
    zIndex: 5,
  },
  title: { color: "#FFFFFF", marginBottom: 20, fontSize: 26 },
  
  nutritionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  nutritionBubble: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  nutritionValue: { fontSize: 17, fontWeight: "800" },
  nutritionLabel: { fontSize: 10, fontWeight: "600" },
  
  sectionBlock: { marginBottom: 30 },
  sectionTitle: { color: "#FFFFFF", marginBottom: 16, fontSize: 20 },

  /* --- INGRÉDIENTS --- */
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 10,
  },
  ingredientDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#F5D90A', // Jaune rappelant les lipides
    marginRight: 10,
  },
  ingredientQuantity: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ingredientText: { color: "#F2F8EF", fontSize: 15, lineHeight: 22, flex: 1 },

  /* --- ÉTAPES DE PRÉPARATION --- */
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)', // Très léger fond pour détacher l'étape
    padding: 12,
    borderRadius: 16,
  },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F9AB24', // Orange de ta charte
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepBadgeText: {
    color: '#111111', fontWeight: 'bold', fontSize: 14,
  },
  stepText: { color: "#F2F8EF", fontSize: 15, lineHeight: 24, flex: 1 },

  bonAppetitContainer: { alignItems: "center", marginTop: 20 },
  mascotImage: { width: 80, height: 80, marginBottom: 8 },
  bonAppetitText: { color: "#FFFFFF", fontSize: 24, fontWeight: "bold" },

  /* --- FEEDBACK OUI/NON --- */
  bottomSectionContainer: {
    width: "100%",
    // Padding Bottom pour couper net et pas avoir trop de blanc en dessous
    paddingBottom: 40, 
    marginTop: -30,
    paddingTop: 60,
    overflow: 'hidden', // Empêche l'image de déborder en dessous
  },
  bottomPictoImage: { opacity: 0.5, resizeMode: "cover" },
  feedbackContainer: { alignItems: "center" },
  feedbackTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 16, 
    color: "#111111" // Forcé en noir pour contraste
  },
  feedbackButtons: { flexDirection: "row", gap: 16 },
  btnAction: {
    backgroundColor: "#EBE9DF", flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 30, borderRadius: 25,
    minWidth: 110, justifyContent: "center",
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  btnActionActive: { backgroundColor: "#D6D3C0" },
  btnText: { color: "#111111", fontWeight: "700", fontSize: 17 },
});