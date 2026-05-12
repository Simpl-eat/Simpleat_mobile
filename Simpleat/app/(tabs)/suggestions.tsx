import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChips, type FilterOption } from '@/components/filter-chips';
import { RecipeCard } from '@/components/recipe-card';
import { SearchBar } from '@/components/search-bar';
import {
  useFilteredRecipes,
  type SuggestionFilters,
  type TimeFilter,
} from '@/hooks/useFilteredRecipes';
import { useProfile } from '@/hooks/useProfile';
import { useRecipePreferences } from '@/hooks/useRecipePreferences';
import { DIET_GOAL_LABELS } from '@/lib/diet-goal-labels';
import type { Recipe } from '@/lib/types/recipe';

// ---------------------------------------------------------------------------
// Diet → Supabase column mapping
// ---------------------------------------------------------------------------

function getDietColumn(diet: string | undefined): string | null {
  switch (diet) {
    case 'Vegan':
      return 'vegan';
    case 'Vegetarian':
      return 'vegetarian';
    case 'Keto':
      return 'keto';
    case 'Dukan':
      return 'dukan';
    case 'Mediterranean':
    case 'Pesco-vegetarian':
      return 'mediterranean';
    case 'Carnivore':
      return 'carnivore';
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Static filter options
// ---------------------------------------------------------------------------

const TIME_OPTIONS: FilterOption[] = [
  { key: '15', label: '< 15 min' },
  { key: '30', label: '< 30 min' },
  { key: '60', label: '< 1 h' },
  { key: '60+', label: '> 1 h' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SuggestionsScreen() {
  const insets = useSafeAreaInsets();

  // Data hooks
  const { profile } = useProfile();
  const { preferences, togglePreference } = useRecipePreferences();

  // Filter state
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);
  const [lunchType, setLunchType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [onlyFromStock, setOnlyFromStock] = useState(false);

  const dietColumn = useMemo(() => getDietColumn(profile?.diet), [profile?.diet]);

  const filters: SuggestionFilters = useMemo(
    () => ({
      search,
      dietColumn,
      timeFilter,
      lunchType,
      category,
      area,
      onlyFromStock,
    }),
    [search, dietColumn, timeFilter, lunchType, category, area, onlyFromStock],
  );

  const { recipes, isLoading, error, filterOptions, refetch } = useFilteredRecipes(filters);

  // Derived filter options from DB data
  const lunchTypeOptions: FilterOption[] = useMemo(
    () => filterOptions.lunchTypes.map((v) => ({ key: v, label: v })),
    [filterOptions.lunchTypes],
  );

  const categoryOptions: FilterOption[] = useMemo(
    () => filterOptions.categories.map((v) => ({ key: v, label: v })),
    [filterOptions.categories],
  );

  const areaOptions: FilterOption[] = useMemo(
    () => filterOptions.areas.map((v) => ({ key: v, label: v })),
    [filterOptions.areas],
  );

  // Active filter count (for quick visual feedback)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (timeFilter) count++;
    if (lunchType) count++;
    if (category) count++;
    if (area) count++;
    if (onlyFromStock) count++;
    return count;
  }, [timeFilter, lunchType, category, area, onlyFromStock]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setTimeFilter(null);
    setLunchType(null);
    setCategory(null);
    setArea(null);
    setOnlyFromStock(false);
  }, []);

  // Navigation
  const goToRecipe = useCallback((id: number) => {
    router.push({
      pathname: '/(tabs)/(protected)/receipe/[id]',
      params: { id: String(id) },
    });
  }, []);

  // Diet label for the info badge
  const dietLabel = profile?.diet ? (DIET_GOAL_LABELS[profile.diet] ?? profile.diet) : null;
  const showDietBadge = dietColumn != null && dietLabel != null;

  // Render
  const renderItem = useCallback(
    ({ item }: { item: Recipe }) => (
      <View style={styles.cardWrapper}>
        <RecipeCard
          recipe={item}
          preference={preferences.get(item.id)}
          onPress={() => goToRecipe(item.id)}
          onLike={() => togglePreference(item.id, true)}
          onDislike={() => togglePreference(item.id, false)}
        />
      </View>
    ),
    [preferences, goToRecipe, togglePreference],
  );

  const keyExtractor = useCallback((item: Recipe) => String(item.id), []);

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        {/* Title */}
        <Text style={styles.title}>Suggestions</Text>
        <Text style={styles.subtitle}>Trouve la recette parfaite pour toi</Text>

        {/* Search */}
        <SearchBar value={search} onChangeText={setSearch} />

        {/* Diet badge */}
        {showDietBadge && (
          <View style={styles.dietBadge}>
            <MaterialCommunityIcons name="leaf" size={14} color="#4A6332" />
            <Text style={styles.dietBadgeText}>Régime : {dietLabel}</Text>
          </View>
        )}

        {/* "À partir de ce que j'ai" toggle */}
        <Pressable
          style={styles.stockToggle}
          onPress={() => setOnlyFromStock((v) => !v)}
        >
          <View style={styles.stockToggleLeft}>
            <MaterialCommunityIcons
              name="fridge-outline"
              size={20}
              color={onlyFromStock ? '#4A6332' : '#6B7280'}
            />
            <Text style={[styles.stockToggleText, onlyFromStock && styles.stockToggleTextActive]}>
              À partir de ce que j'ai
            </Text>
          </View>
          <Switch
            value={onlyFromStock}
            onValueChange={setOnlyFromStock}
            trackColor={{ false: '#D1D5DB', true: '#A8C699' }}
            thumbColor={onlyFromStock ? '#4A6332' : '#F9FAFB'}
          />
        </Pressable>

        {/* Filters */}
        <FilterChips
          label="Temps de préparation"
          options={TIME_OPTIONS}
          selected={timeFilter}
          onSelect={(key) => setTimeFilter(key as TimeFilter)}
        />

        <FilterChips
          label="Type de repas"
          options={lunchTypeOptions}
          selected={lunchType}
          onSelect={setLunchType}
        />

        <FilterChips
          label="Catégorie"
          options={categoryOptions}
          selected={category}
          onSelect={setCategory}
        />

        <FilterChips
          label="Origine"
          options={areaOptions}
          selected={area}
          onSelect={setArea}
        />

        {/* Active filter count + clear */}
        {activeFilterCount > 0 && (
          <Pressable style={styles.clearRow} onPress={clearFilters}>
            <Text style={styles.clearText}>
              {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''} actif
              {activeFilterCount > 1 ? 's' : ''}
            </Text>
            <Text style={styles.clearBtn}>Tout effacer</Text>
          </Pressable>
        )}

        {/* Result count */}
        <Text style={styles.resultCount}>
          {isLoading ? 'Recherche...' : `${recipes.length} recette${recipes.length !== 1 ? 's' : ''}`}
        </Text>
      </View>
    ),
    [
      search,
      showDietBadge,
      dietLabel,
      onlyFromStock,
      timeFilter,
      lunchType,
      lunchTypeOptions,
      category,
      categoryOptions,
      area,
      areaOptions,
      activeFilterCount,
      clearFilters,
      isLoading,
      recipes.length,
    ],
  );

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#4A6332" />
          <Text style={styles.emptyText}>Chargement des recettes...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#E55353" />
          <Text style={styles.emptyTitle}>Erreur</Text>
          <Text style={styles.emptyText}>{error.message}</Text>
          <Pressable style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="food-off" size={48} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Aucune recette trouvée</Text>
        <Text style={styles.emptyText}>Essaie de modifier tes filtres ou ta recherche.</Text>
        {activeFilterCount > 0 && (
          <Pressable style={styles.retryBtn} onPress={clearFilters}>
            <Text style={styles.retryText}>Effacer les filtres</Text>
          </Pressable>
        )}
      </View>
    );
  }, [isLoading, error, refetch, activeFilterCount, clearFilters]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={recipes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F3EA',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerContainer: {
    gap: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: -6,
  },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#EDF5E4',
  },
  dietBadgeText: {
    fontSize: 12,
    color: '#4A6332',
    fontWeight: '500',
  },
  stockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stockToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stockToggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  stockToggleTextActive: {
    color: '#4A6332',
  },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearText: {
    fontSize: 13,
    color: '#6B7280',
  },
  clearBtn: {
    fontSize: 13,
    color: '#E55353',
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cardWrapper: {
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4A6332',
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
