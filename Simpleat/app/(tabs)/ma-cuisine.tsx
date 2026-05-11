import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFridge } from '@/hooks/useFridge';
import { supabase } from '@/lib/supabase';
import type { Ingredient } from '@/lib/types/ingredient';
import type { UserStock } from '@/lib/types/user-stock';

type QuantityMap = Record<number, string>;

export default function MaCuisineScreen() {
  const { stockItems, ingredients, isLoading, error, reload } = useFridge();
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const availableIngredients = useMemo(
    () =>
      ingredients
        .filter((ingredient) => !stockItems.some((item) => item.ingredient_id === ingredient.id))
        .filter((ingredient) =>
          ingredient.name.toLowerCase().includes(search.trim().toLowerCase())
        ),
    [ingredients, stockItems, search]
  );

  const setQuantity = useCallback((key: number, value: string) => {
    setQuantities((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function addIngredient(ingredientId: number) {
    setLocalError(null);

    const rawValue = quantities[ingredientId]?.trim() ?? '';
    const quantity = Number(rawValue.replace(',', '.'));

    if (!quantity || quantity <= 0) {
      setLocalError('Saisis une quantité valide.');
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        throw new Error(userError?.message ?? 'Utilisateur non connecté.');
      }

      const { data: existingStock, error: fetchError } = await supabase
        .from('userStock')
        .select('*')
        .eq('user_id', user.id)
        .eq('ingredient_id', ingredientId)
        .is('deleted_at', null)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingStock) {
        await supabase
          .from('userStock')
          .update({ quantity })
          .eq('id', existingStock.id);
      } else {
        await supabase.from('userStock').insert({
          user_id: user.id,
          ingredient_id: ingredientId,
          quantity,
        });
      }

      await reload();
      setQuantities((prev) => ({ ...prev, [ingredientId]: '' }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Impossible d’ajouter l’ingrédient.');
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStockLine(stockLine: UserStock) {
    setLocalError(null);

    const rawValue = quantities[stockLine.id]?.trim() ?? '';
    const quantity = Number(rawValue.replace(',', '.'));

    if (!quantity || quantity <= 0) {
      setLocalError('Saisis une quantité valide.');
      return;
    }

    setIsSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('userStock')
        .update({ quantity })
        .eq('id', stockLine.id);

      if (updateError) {
        throw updateError;
      }

      await reload();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Impossible de mettre à jour.');
    } finally {
      setIsSaving(false);
    }
  }

  async function removeStockLine(stockLine: UserStock) {
    setIsSaving(true);
    setLocalError(null);

    try {
      const { error: deleteError } = await supabase.from('userStock').delete().eq('id', stockLine.id);

      if (deleteError) {
        throw deleteError;
      }

      await reload();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Impossible de supprimer.');
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
              {isSaving ? 'Enregistrement…' : 'Chargement…'}
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
            Stock actuel
          </ThemedText>
          {stockItems.length === 0 ? (
            <ThemedText style={styles.whiteText}>Aucun ingrédient enregistré.</ThemedText>
          ) : (
            stockItems.map((stockLine) => (
              <View key={stockLine.id} style={styles.stockRow}>
                <View style={styles.stockInfo}>
                  <ThemedText style={[styles.stockName, styles.whiteText]}>
                    {stockLine.ingredient?.name ?? 'Ingrédient inconnu'}
                  </ThemedText>
                  <TextInput
                    value={quantities[stockLine.id] ?? String(stockLine.quantity)}
                    onChangeText={(value) => setQuantity(stockLine.id, value)}
                    placeholder="Quantité"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>

                <View style={styles.stockActions}>
                  <Pressable style={styles.button} onPress={() => updateStockLine(stockLine)}>
                    <ThemedText type="link" style={styles.whiteText}>
                      Modifier
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.deleteButton]}
                    onPress={() => removeStockLine(stockLine)}
                  >
                    <ThemedText style={styles.deleteLabel}>Supprimer</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.whiteText}>
            Ajouter un ingrédient
          </ThemedText>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un ingrédient"
            style={styles.input}
          />

          <FlatList<Ingredient>
            data={availableIngredients}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.ingredientRow}>
                <View style={styles.ingredientInfo}>
                  <ThemedText style={styles.whiteText}>{item.name}</ThemedText>
                  <TextInput
                    value={quantities[item.id] ?? ''}
                    onChangeText={(value) => setQuantity(item.id, value)}
                    placeholder="Quantité"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>
                <Pressable style={styles.button} onPress={() => addIngredient(item.id)}>
                  <ThemedText type="link" style={styles.whiteText}>
                    Ajouter
                  </ThemedText>
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <ThemedText style={styles.whiteText}>Aucun ingrédient disponible.</ThemedText>
            }
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F3EA',
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
    borderColor: '#E55353',
  },
  stockRow: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#4F7343',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    gap: 12,
  },
  stockInfo: {
    gap: 8,
  },
  stockName: {
    fontWeight: '700',
  },
  stockActions: {
    flexDirection: 'row',
    gap: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#4F7343',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  ingredientInfo: {
    flex: 1,
    gap: 8,
  },
  input: {
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#d5cb01',
  },
  deleteButton: {
    backgroundColor: '#E55353',
  },
  deleteLabel: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingBottom: 24,
  },
  whiteText: {
    color: '#000000',
  },
});
