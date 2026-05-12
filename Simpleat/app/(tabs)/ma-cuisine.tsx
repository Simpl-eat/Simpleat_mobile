import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

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
  const { stockItems, ingredients, isLoading, error, reload } = useFridge();
  const [search, setSearch] = useState("");
  const [selectedIngredientId, setSelectedIngredientId] = useState<
    number | null
  >(null);
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedStockLine, setSelectedStockLine] =
    useState<StockLineWithIngredient | null>(null);

  const availableIngredients = useMemo(
    () =>
      ingredients.filter(
        (ingredient) =>
          !stockItems.some((item) => item.ingredient_id === ingredient.id),
      ),
    [ingredients, stockItems],
  );

  const normalizedSearch = search.trim().toLowerCase();

  const dropdownResults = useMemo(
    () =>
      availableIngredients.filter((ingredient) =>
        (ingredient.name_fr ?? "").toLowerCase().includes(normalizedSearch),
      ),
    [availableIngredients, normalizedSearch],
  );

  const showDropdown =
    normalizedSearch.length > 0 && selectedIngredientId === null;

  const canAddSelectedIngredient = useMemo(() => {
    if (selectedIngredientId === null) return false;
    const rawValue = quantities[selectedIngredientId]?.trim() ?? "";
    const quantity = Number(rawValue.replace(",", "."));
    return Boolean(quantity && quantity > 0);
  }, [quantities, selectedIngredientId]);

  const setQuantity = useCallback((key: number, value: string) => {
    setQuantities((prev) => ({ ...prev, [key]: value }));
  }, []);

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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        throw new Error(userError?.message ?? "Utilisateur non connecté.");
      }

      const { data: existingStock, error: fetchError } = await supabase
        .from("userStock")
        .select("*")
        .eq("user_id", user.id)
        .eq("ingredient_id", ingredientId)
        .is("deleted_at", null)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingStock) {
        await supabase
          .from("userStock")
          .update({ quantity })
          .eq("id", existingStock.id);
      } else {
        await supabase.from("userStock").insert({
          user_id: user.id,
          ingredient_id: ingredientId,
          quantity,
        });
      }

      await reload();
      setQuantities((prev) => ({ ...prev, [ingredientId]: "" }));
      setSearch("");
      setSelectedIngredientId(null);
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : "Impossible d’ajouter l’ingrédient.",
      );
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
      const { error: updateError } = await supabase
        .from("userStock")
        .update({ quantity })
        .eq("id", stockLine.id);

      if (updateError) {
        throw updateError;
      }

      await reload();
      setSelectedStockLine(null);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Impossible de mettre à jour.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeStockLine(stockLine: UserStock) {
    setIsSaving(true);
    setLocalError(null);

    try {
      const { error: deleteError } = await supabase
        .from("userStock")
        .delete()
        .eq("id", stockLine.id);

      if (deleteError) {
        throw deleteError;
      }

      await reload();
      setSelectedStockLine(null);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Impossible de supprimer.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.whiteText}>
            Ma cuisine
          </ThemedText>
          <ThemedText style={[styles.subtitle, styles.whiteText]}>
            Ajoute des ingrédients et indique combien tu en as.
          </ThemedText>
        </View>

        {(isLoading || isSaving) && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" />
            <ThemedText style={styles.whiteText}>
              {isSaving ? "Enregistrement…" : "Chargement…"}
            </ThemedText>
          </View>
        )}

        {(error || localError) && (
          <View style={styles.errorBox}>
            <ThemedText type="subtitle" style={styles.whiteText}>
              Erreur
            </ThemedText>
            <ThemedText style={styles.whiteText}>
              {error?.message ?? localError}
            </ThemedText>
          </View>
        )}

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.whiteText}>
            Ajouter un ingrédient
          </ThemedText>
          <View style={styles.addRow}>
            <View style={styles.searchContainer}>
              <TextInput
                value={search}
                onChangeText={(value) => {
                  setSearch(value);
                  setSelectedIngredientId(null);
                }}
                placeholder="Rechercher un ingrédient"
                style={styles.input}
              />
              {showDropdown && (
                <View style={styles.dropdown}>
                  <FlatList<Ingredient>
                    data={dropdownResults}
                    keyExtractor={(item) => `dropdown-${item.id}`}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                      <ThemedText style={styles.dropdownEmptyText}>
                        Aucun résultat.
                      </ThemedText>
                    }
                    renderItem={({ item }) => (
                      <Pressable
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedIngredientId(item.id);
                          setSearch(item.name_fr ?? "");
                        }}
                      >
                        <ThemedText style={styles.dropdownItemText}>
                          {item.name_fr}
                        </ThemedText>
                      </Pressable>
                    )}
                  />
                </View>
              )}
            </View>

            <TextInput
              value={
                selectedIngredientId === null
                  ? ""
                  : (quantities[selectedIngredientId] ?? "")
              }
              onChangeText={(value) => {
                if (selectedIngredientId === null) return;
                setQuantity(selectedIngredientId, value);
              }}
              placeholder="Qté"
              keyboardType="decimal-pad"
              style={[styles.input, styles.quantityInput]}
              editable={selectedIngredientId !== null}
            />

            <Pressable
              style={[
                styles.button,
                styles.addButton,
                (!canAddSelectedIngredient || isSaving) &&
                  styles.buttonDisabled,
              ]}
              disabled={!canAddSelectedIngredient || isSaving}
              onPress={() => {
                if (selectedIngredientId === null) return;
                void addIngredient(selectedIngredientId);
              }}
            >
              <ThemedText style={styles.addButtonLabel}>Ajouter</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="subtitle" style={styles.whiteText}>
            Stock actuel
          </ThemedText>
          {stockItems.length === 0 ? (
            <ThemedText style={styles.whiteText}>
              Aucun ingrédient enregistré.
            </ThemedText>
          ) : (
            <View style={styles.stockGrid}>
              {stockItems.map((stockLine) => (
                <View key={stockLine.id} style={styles.stockCell}>
                  <Pressable
                    style={styles.stockRow}
                    onPress={() => setSelectedStockLine(stockLine)}
                  >
                    <ThemedText
                      style={[styles.stockName, styles.whiteText]}
                      numberOfLines={2}
                    >
                      {stockLine.ingredient?.name_fr ?? "Ingrédient inconnu"}
                    </ThemedText>
                    <ThemedText style={styles.whiteText}>
                      Quantité: {stockLine.quantity}
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <Modal
        transparent
        visible={selectedStockLine !== null}
        animationType="fade"
        onRequestClose={() => setSelectedStockLine(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText type="subtitle" style={styles.stockName}>
              {selectedStockLine?.ingredient?.name_fr ?? "Ingrédient inconnu"}
            </ThemedText>

            <TextInput
              value={
                selectedStockLine
                  ? (quantities[selectedStockLine.id] ??
                    String(selectedStockLine.quantity))
                  : ""
              }
              onChangeText={(value) => {
                if (!selectedStockLine) return;
                setQuantity(selectedStockLine.id, value);
              }}
              placeholder="Quantité"
              keyboardType="decimal-pad"
              style={styles.input}
              editable={selectedStockLine !== null}
            />

            <View style={styles.stockActions}>
              <Pressable
                style={styles.button}
                onPress={() => {
                  if (!selectedStockLine) return;
                  void updateStockLine(selectedStockLine);
                }}
              >
                <ThemedText type="link" style={styles.whiteText}>
                  Modifier
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.button, styles.deleteButton]}
                onPress={() => {
                  if (!selectedStockLine) return;
                  void removeStockLine(selectedStockLine);
                }}
              >
                <ThemedText style={styles.deleteLabel}>Supprimer</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F3EA",
  },
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  subtitle: {
    opacity: 0.8,
  },
  section: {
    gap: 12,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    position: "relative",
    zIndex: 10,
  },
  dropdown: {
    marginTop: 6,
    maxHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  dropdownItemText: {
    color: "#1F1F1F",
  },
  dropdownEmptyText: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: "#6B6B6B",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFE8E8",
    borderWidth: 1,
    borderColor: "#E55353",
  },
  stockGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  stockCell: {
    width: "33.333%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  stockRow: {
    flex: 1,
    minHeight: 100,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#4F7343",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    gap: 8,
    justifyContent: "space-between",
  },
  stockName: {
    fontWeight: "700",
    color: "black",
  },
  stockActions: {
    flexDirection: "row",
    gap: 10,
  },
  ingredientCell: {
    width: "25%",
    padding: 4,
  },
  ingredientRow: {
    height: 180,
    justifyContent: "space-between",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#4F7343",
    borderWidth: 1,
    borderColor: "#D9D9D9",
  },
  ingredientName: {
    minHeight: 40,
  },
  ingredientInfo: {
    flex: 1,
    gap: 8,
  },
  input: {
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FAFAFA",
  },
  quantityInput: {
    width: 90,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#d5cb01",
  },
  addButton: {
    height: 44,
    justifyContent: "center",
  },
  addButtonLabel: {
    color: "#1F1F1F",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  deleteButton: {
    backgroundColor: "#E55353",
  },
  deleteLabel: {
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
  },
  listContainer: {
    paddingBottom: 24,
  },
  whiteText: {
    color: "#000000",
  },
});
