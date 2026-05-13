import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform, // <-- AJOUTÉ
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,     // <-- AJOUTÉ
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFridge } from "@/hooks/useFridge";
import { supabase } from "@/lib/supabase";
import type { Ingredient } from "@/lib/types/ingredient";
import type { UserStock } from "@/lib/types/user-stock";

type QuantityMap = Record<number, string>;
type StockLineWithIngredient = UserStock & {
  ingredient?: { name_fr?: string | null } | null;
};

export default function MaCuisineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stockItems, ingredients, isLoading, error, reload } = useFridge();
  
  const [search, setSearch] = useState("");
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedStockLine, setSelectedStockLine] = useState<StockLineWithIngredient | null>(null);
  
  const [refreshing, setRefreshing] = useState(false);

  const availableIngredients = useMemo(
    () => ingredients.filter((ingredient) => !stockItems.some((item) => item.ingredient_id === ingredient.id)),
    [ingredients, stockItems],
  );

  const normalizedSearch = search.trim().toLowerCase();

  const dropdownResults = useMemo(
    () => availableIngredients.filter((ingredient) => (ingredient.name_fr ?? "").toLowerCase().includes(normalizedSearch)),
    [availableIngredients, normalizedSearch],
  );

  const showDropdown = normalizedSearch.length > 0 && selectedIngredientId === null;

  const canAddSelectedIngredient = useMemo(() => {
    if (selectedIngredientId === null) return false;
    const rawValue = quantities[selectedIngredientId]?.trim() ?? "";
    const quantity = Number(rawValue.replace(",", "."));
    return Boolean(quantity && quantity > 0);
  }, [quantities, selectedIngredientId]);

  const setQuantity = useCallback((key: number, value: string) => {
    setQuantities((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  async function addIngredient(ingredientId: number) {
    setLocalError(null);
    const rawValue = quantities[ingredientId]?.trim() ?? "";
    const quantity = Number(rawValue.replace(",", "."));

    if (!quantity || quantity <= 0) {
      setLocalError("Saisis une quantité valide.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) throw new Error(userError?.message ?? "Utilisateur non connecté.");

      const { data: existingStock, error: fetchError } = await supabase
        .from("userStock")
        .select("*")
        .eq("user_id", user.id)
        .eq("ingredient_id", ingredientId)
        .is("deleted_at", null)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingStock) {
        await supabase.from("userStock").update({ quantity }).eq("id", existingStock.id);
      } else {
        await supabase.from("userStock").insert({ user_id: user.id, ingredient_id: ingredientId, quantity });
      }

      await reload();
      setQuantities((prev) => ({ ...prev, [ingredientId]: "" }));
      setSearch("");
      setSelectedIngredientId(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Impossible d’ajouter l’ingrédient.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStockLine(stockLine: UserStock) {
    setLocalError(null);
    const rawValue = quantities[stockLine.id]?.trim() ?? "";
    const quantity = Number(rawValue.replace(",", "."));

    if (!quantity || quantity <= 0) {
      setLocalError("Saisis une quantité valide.");
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase.from("userStock").update({ quantity }).eq("id", stockLine.id);
      if (updateError) throw updateError;

      await reload();
      setSelectedStockLine(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Impossible de mettre à jour.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeStockLine(stockLine: UserStock) {
    setIsSaving(true);
    setLocalError(null);
    try {
      const { error: deleteError } = await supabase.from("userStock").delete().eq("id", stockLine.id);
      if (deleteError) throw deleteError;

      await reload();
      setSelectedStockLine(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Impossible de supprimer.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ThemedView style={[styles.screen, { paddingTop: Math.max(0, insets.top - 15) }]}>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#496943']} tintColor={'#496943'} />
        }
      >
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image source={require('@/assets/images/broco_waving.png')} style={styles.mascot} resizeMode="contain" />
            <View style={styles.headerTextContainer}>
              <ThemedText type="title" style={styles.title}>Ma cuisine</ThemedText>
              <ThemedText style={styles.subtitle}>Ajoute tes ingrédients ici.</ThemedText>
            </View>
          </View>
        </View>

        {/* FEEDBACK & ERREURS */}
        {(isLoading || isSaving) && !refreshing && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#496943" />
            <ThemedText style={styles.statusText}>
              {isSaving ? "Enregistrement…" : "Chargement…"}
            </ThemedText>
          </View>
        )}

        {(error || localError) && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#E55353" />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.errorTitle}>Erreur</ThemedText>
              <ThemedText style={styles.errorText}>{error?.message ?? localError}</ThemedText>
            </View>
          </View>
        )}

        {/* SECTION AJOUTER & SCAN */}
        <View style={styles.section}>
          
          <Pressable
            style={styles.scanButton}
            onPress={() => router.push('/scan' as any)} // <-- CORRECTION ICI
          >
            <Ionicons name="barcode-outline" size={22} color="#FFFFFF" />
            <ThemedText style={styles.scanButtonText}>Scanner un article</ThemedText>
          </Pressable>

          <View style={styles.addRow}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  value={search}
                  onChangeText={(value) => {
                    setSearch(value);
                    setSelectedIngredientId(null);
                  }}
                  placeholder="Ex: Tomate, Poulet..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
              </View>

              {/* DROPDOWN RECHERCHE */}
              {showDropdown && (
                <View style={styles.dropdown}>
                  <FlatList<Ingredient>
                    data={dropdownResults}
                    keyExtractor={(item) => `dropdown-${item.id}`}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    ListEmptyComponent={
                      <ThemedText style={styles.dropdownEmptyText}>Aucun résultat.</ThemedText>
                    }
                    renderItem={({ item }) => (
                      <Pressable
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedIngredientId(item.id);
                          setSearch(item.name_fr ?? "");
                        }}
                      >
                        <ThemedText style={styles.dropdownItemText}>{item.name_fr}</ThemedText>
                      </Pressable>
                    )}
                  />
                </View>
              )}
            </View>

            <TextInput
              value={selectedIngredientId === null ? "" : (quantities[selectedIngredientId] ?? "")}
              onChangeText={(value) => {
                if (selectedIngredientId === null) return;
                setQuantity(selectedIngredientId, value);
              }}
              placeholder="Qté"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={[styles.input, styles.quantityInput]}
              editable={selectedIngredientId !== null}
            />

            <Pressable
              style={[styles.addButton, (!canAddSelectedIngredient || isSaving) && styles.buttonDisabled]}
              disabled={!canAddSelectedIngredient || isSaving}
              onPress={() => {
                if (selectedIngredientId === null) return;
                void addIngredient(selectedIngredientId);
              }}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* SECTION STOCK ACTUEL */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Mon Stock ({stockItems.length})
          </ThemedText>
          
          {stockItems.length === 0 ? (
            <View style={styles.emptyStock}>
              <Ionicons name="basket-outline" size={48} color="#C4C4C4" />
              <ThemedText style={styles.emptyStockText}>Ton frigo est vide !</ThemedText>
            </View>
          ) : (
            <View style={styles.stockGrid}>
              {stockItems.map((stockLine) => (
                <View key={stockLine.id} style={styles.stockCell}>
                  <Pressable
                    style={styles.stockCard}
                    onPress={() => setSelectedStockLine(stockLine)}
                  >
                    <ThemedText style={styles.stockName} numberOfLines={2}>
                      {stockLine.ingredient?.name_fr ?? "Ingrédient inconnu"}
                    </ThemedText>
                    <View style={styles.stockQtyBadge}>
                      <ThemedText style={styles.stockQtyText}>{stockLine.quantity}</ThemedText>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL DE MODIFICATION (Style Bottom Sheet) */}
      <Modal
        transparent
        visible={selectedStockLine !== null}
        animationType="slide"
        onRequestClose={() => setSelectedStockLine(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedStockLine(null)} />
          
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {selectedStockLine?.ingredient?.name_fr ?? "Ingrédient inconnu"}
            </Text>

            <View style={styles.modalInputGroup}>
              <ThemedText style={styles.modalLabel}>Modifier la quantité :</ThemedText>
              <TextInput
                value={selectedStockLine ? (quantities[selectedStockLine.id] ?? String(selectedStockLine.quantity)) : ""}
                onChangeText={(value) => {
                  if (!selectedStockLine) return;
                  setQuantity(selectedStockLine.id, value);
                }}
                placeholder="Nouvelle quantité"
                keyboardType="decimal-pad"
                style={styles.modalInput}
                editable={selectedStockLine !== null}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => {
                  if (!selectedStockLine) return;
                  void removeStockLine(selectedStockLine);
                }}
              >
                <Ionicons name="trash-outline" size={24} color="#E55353" />
              </Pressable>
              
              <Pressable
                style={styles.applyBtn}
                onPress={() => {
                  if (!selectedStockLine) return;
                  void updateStockLine(selectedStockLine);
                }}
              >
                <ThemedText style={styles.applyBtnText}>Mettre à jour le stock</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F3EA" },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 24 },
  
  // HEADER
  header: { marginBottom: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mascot: { width: 65, height: 65 },
  headerTextContainer: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: -2 },

  // ÉTATS & ERREURS
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8 },
  statusText: { color: "#496943", fontWeight: "600" },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: "#FFF0F0", borderWidth: 1, borderColor: "#FFE0E0" },
  errorTitle: { fontWeight: '700', color: '#E55353', fontSize: 16 },
  errorText: { color: '#E55353', marginTop: 4 },

  // SECTIONS
  section: { gap: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#496943' },

  // BOUTON SCAN
  scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#496943', paddingVertical: 14, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  scanButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  // AJOUTER (SEARCH BAR)
  addRow: { flexDirection: "row", gap: 10, zIndex: 10 },
  searchContainer: { flex: 1, position: "relative", zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEAEA', paddingHorizontal: 12, height: 50 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#111111' },
  
  input: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEAEA', paddingHorizontal: 12, fontSize: 16, color: '#111111', height: 50, textAlign: 'center' },
  quantityInput: { width: 70 },
  
  addButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#496943", alignItems: "center", justifyContent: "center", shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  buttonDisabled: { opacity: 0.5 },

  // DROPDOWN
  dropdown: { position: 'absolute', top: 55, left: 0, right: 0, maxHeight: 220, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EAEAEA", shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5, zIndex: 50 },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  dropdownItemText: { color: "#1F2937", fontSize: 16, fontWeight: '500' },
  dropdownEmptyText: { padding: 16, color: "#9CA3AF", textAlign: 'center' },

  // STOCK GRID (2 COLONNES)
  stockGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: 'space-between' },
  stockCell: { width: "48%", marginBottom: 16 },
  stockCard: { backgroundColor: "#EBE9DF", borderRadius: 18, padding: 16, minHeight: 90, justifyContent: "space-between", shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  stockName: { fontSize: 15, fontWeight: "700", color: "#496943", marginBottom: 12 },
  stockQtyBadge: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  stockQtyText: { fontSize: 14, fontWeight: '800', color: '#111111' },

  emptyStock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#EAEAEA', borderStyle: 'dashed' },
  emptyStockText: { color: '#9CA3AF', fontSize: 16, fontWeight: '600', marginTop: 12 },

  // MODAL (Style Bottom Sheet)
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  bottomSheet: { backgroundColor: '#F7F3EA', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  sheetHandle: { width: 45, height: 5, backgroundColor: '#D1D5DB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 24, textAlign: 'center' },
  
  modalLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8, fontWeight: '600' },
  modalInputGroup: { marginBottom: 30 },
  modalInput: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, fontSize: 20, color: '#111111', fontWeight: 'bold', textAlign: 'center', borderWidth: 1, borderColor: '#EAEAEA' },
  
  modalActions: { flexDirection: 'row', gap: 12 },
  deleteBtn: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#FFE8E8', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFE0E0' },
  applyBtn: { flex: 1, height: 60, borderRadius: 20, backgroundColor: '#496943', alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});