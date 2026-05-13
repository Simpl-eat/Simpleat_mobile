import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
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
import { useRecipePreferences } from '@/hooks/useRecipePreference';
import type { Recipe } from '@/lib/types/recipe';

const ITEMS_PER_PAGE = 10; // Nombre de recettes par page

function getDietColumn(diet: string | undefined): string | null {
  switch (diet) {
    case 'Vegan': return 'vegan';
    case 'Vegetarian': return 'vegetarian';
    case 'Keto': return 'keto';
    case 'Dukan': return 'dukan';
    case 'Mediterranean':
    case 'Pesco-vegetarian': return 'mediterranean';
    case 'Carnivore': return 'carnivore';
    default: return null;
  }
}

function formatFilterLabel(raw: string) {
  if (!raw) return '';
  const formatted = raw.replace(/_/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
}

const TIME_OPTIONS: FilterOption[] = [
  { key: '15', label: '< 15 min' },
  { key: '30', label: '< 30 min' },
  { key: '60', label: '< 1 h' },
  { key: '60+', label: '> 1 h' },
];

export default function SuggestionsScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null); // Référence pour scroller en haut

  // --- ÉTATS UI ---
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // État pour la pagination

  // --- ÉTATS FILTRES ---
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);
  const [lunchType, setLunchType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [onlyFromStock, setOnlyFromStock] = useState(false);

  // --- HOOKS DE DONNÉES ---
  const { profile } = useProfile();
  const { preferences, togglePreference } = useRecipePreferences();

  const dietColumn = useMemo(() => getDietColumn(profile?.diet), [profile?.diet]);

  const filters: SuggestionFilters = useMemo(() => ({
    search, dietColumn, timeFilter, lunchType, category, area, onlyFromStock,
  }), [search, dietColumn, timeFilter, lunchType, category, area, onlyFromStock]);

  const { recipes, isLoading, filterOptions } = useFilteredRecipes(filters);

  // --- GESTION DE LA PAGINATION ---
  // Réinitialiser à la page 1 si on change les filtres ou la recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [recipes]);

  const totalPages = Math.ceil(recipes.length / ITEMS_PER_PAGE);

  // Extraire uniquement les recettes de la page courante
  const displayedRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return recipes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [recipes, currentPage]);

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      scrollToTop();
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      scrollToTop();
    }
  };

  // --- OPTIONS DE FILTRES FORMATÉES ---
  const lunchTypeOptions = useMemo(() => filterOptions.lunchTypes.map((v) => ({ key: v, label: formatFilterLabel(v) })), [filterOptions.lunchTypes]);
  const categoryOptions = useMemo(() => filterOptions.categories.map((v) => ({ key: v, label: formatFilterLabel(v) })), [filterOptions.categories]);
  const areaOptions = useMemo(() => filterOptions.areas.map((v) => ({ key: v, label: formatFilterLabel(v) })), [filterOptions.areas]);

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
    setTimeFilter(null);
    setLunchType(null);
    setCategory(null);
    setArea(null);
    setOnlyFromStock(false);
  }, []);

  // --- RENDU D'UNE CARTE ---
  const renderItem = useCallback(({ item }: { item: Recipe }) => (
    <View style={viewMode === 'grid' ? styles.gridItemWrapper : styles.listItemWrapper}>
      <RecipeCard
        recipe={item}
        preference={preferences.get(item.id)}
        viewMode={viewMode}
        onPress={() => router.push(`/(tabs)/(protected)/receipe/${item.id}`)}
        onLike={() => togglePreference(item.id, true)}
        onDislike={() => togglePreference(item.id, false)}
      />
    </View>
  ), [preferences, togglePreference, viewMode]);

  // --- EN-TÊTE ---
  const ListHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <Image source={require('@/assets/images/broco_cooking.png')} style={styles.mascot} resizeMode="contain" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Suggestions</Text>
          <Text style={styles.subtitle}>Trouve la recette parfaite pour toi</Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} />

      <Pressable style={styles.tinderCta} onPress={() => console.log('Go to Tinder Food')}>
        <View style={styles.tinderIconBg}>
          <Ionicons name="flame" size={22} color="#FF5864" />
        </View>
        <Text style={styles.tinderCtaText}>Tinder Food</Text>
        <Ionicons name="chevron-forward" size={20} color="#FF5864" style={styles.tinderChevron} />
      </Pressable>

      <View style={styles.toolsRow}>
        <Pressable 
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]} 
          onPress={() => setIsFilterModalOpen(true)}
        >
          <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? "#FFFFFF" : "#496943"} />
          <Text style={[styles.filterBtnText, activeFilterCount > 0 && { color: '#FFFFFF' }]}>
            Filtres {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </Text>
        </Pressable>

        <View style={styles.viewToggleGroup}>
          <Pressable 
            style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? "#496943" : "#9CA3AF"} />
          </Pressable>
          <Pressable 
            style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid" size={18} color={viewMode === 'grid' ? "#496943" : "#9CA3AF"} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.resultCount}>
        {isLoading ? 'Recherche...' : `${recipes.length} recette${recipes.length !== 1 ? 's' : ''}`}
      </Text>
    </View>
  ), [search, activeFilterCount, viewMode, recipes.length, isLoading]);

  // --- PIED DE PAGE (Pagination Dynamique) ---
  const renderPagination = () => {
    if (isLoading || recipes.length === 0) return null;

    return (
      <View style={styles.paginationWrapper}>
        {totalPages > 1 && (
          <View style={styles.paginationControls}>
            <Pressable 
              style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} 
              onPress={handlePrevPage}
              disabled={currentPage === 1}
            >
              <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#9CA3AF' : '#496943'} />
            </Pressable>

            <Text style={styles.pageText}>
              Page {currentPage} sur {totalPages}
            </Text>

            <Pressable 
              style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]} 
              onPress={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#9CA3AF' : '#496943'} />
            </Pressable>
          </View>
        )}
        
        {/* Info dynamique en bas peu importe s'il y a 1 ou N pages */}
        <Text style={styles.totalCountFooter}>
          {recipes.length} recette{recipes.length > 1 ? 's' : ''} au total
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(0, insets.top - 15) }]}>
      
      <FlatList
        ref={flatListRef}
        key={viewMode}
        data={displayedRecipes}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={renderPagination}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />

      {/* BOTTOM SHEET MODAL */}
      <Modal visible={isFilterModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsFilterModalOpen(false)} />
          
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filtres avancés</Text>

            <FlatList
              data={[]}
              renderItem={() => null}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={styles.filtersContainer}>
                  <Pressable style={styles.stockToggle} onPress={() => setOnlyFromStock(!onlyFromStock)}>
                    <View style={styles.stockToggleLeft}>
                      <Ionicons name="cart-outline" size={24} color={onlyFromStock ? '#496943' : '#6B7280'} />
                      <Text style={[styles.stockToggleText, onlyFromStock && styles.stockToggleTextActive]}>
                        À partir de ce que j'ai
                      </Text>
                    </View>
                    <Switch
                      value={onlyFromStock}
                      onValueChange={setOnlyFromStock}
                      trackColor={{ false: '#E5E7EB', true: '#A8C699' }}
                      thumbColor={onlyFromStock ? '#496943' : '#FFFFFF'}
                    />
                  </Pressable>

                  <FilterChips label="Temps de préparation" options={TIME_OPTIONS} selected={timeFilter} onSelect={(key) => setTimeFilter(key as TimeFilter)} />
                  <FilterChips label="Type de repas" options={lunchTypeOptions} selected={lunchType} onSelect={setLunchType} />
                  <FilterChips label="Catégorie" options={categoryOptions} selected={category} onSelect={setCategory} />
                  <FilterChips label="Origine" options={areaOptions} selected={area} onSelect={setArea} />
                </View>
              }
            />

            <View style={styles.sheetFooter}>
              <Pressable style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Réinitialiser</Text>
              </Pressable>
              <Pressable style={styles.applyBtn} onPress={() => setIsFilterModalOpen(false)}>
                <Text style={styles.applyBtnText}>Voir les résultats</Text>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EA' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  headerContainer: { gap: 14, paddingTop: 12, paddingBottom: 16 },
  
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mascot: { width: 65, height: 65 },
  headerTextContainer: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: -2 },

  tinderCta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F4', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#FFE0E8', marginTop: 6 },
  tinderIconBg: { backgroundColor: '#FFFFFF', padding: 8, borderRadius: 12, marginRight: 14, shadowColor: '#FF5864', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  tinderCtaText: { flex: 1, fontSize: 17, fontWeight: '700', color: '#FF5864' },
  tinderChevron: { opacity: 0.7 },

  toolsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: '#496943', borderColor: '#496943' },
  filterBtnText: { fontSize: 15, fontWeight: '600', color: '#496943' },
  
  viewToggleGroup: { flexDirection: 'row', backgroundColor: '#EBE9DF', borderRadius: 12, padding: 4 },
  viewToggleBtn: { padding: 8, borderRadius: 8 },
  viewToggleBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  
  resultCount: { fontSize: 14, color: '#9CA3AF', fontWeight: '500', marginTop: 4, marginLeft: 2 },
  
  row: { justifyContent: 'space-between' },
  listItemWrapper: { marginBottom: 14 },
  gridItemWrapper: { width: '48%', marginBottom: 16 },

  // --- Styles Pagination ---
  paginationWrapper: { alignItems: 'center', marginVertical: 20 },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 12 },
  pageBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  pageBtnDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0, elevation: 0 },
  pageText: { fontSize: 16, fontWeight: '600', color: '#496943' },
  totalCountFooter: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },

  // Bottom Sheet Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  bottomSheet: { backgroundColor: '#F7F3EA', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '82%', padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  sheetHandle: { width: 45, height: 5, backgroundColor: '#D1D5DB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 24 },
  filtersContainer: { gap: 24, paddingBottom: 20 },
  
  stockToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16, borderWidth: 1, borderColor: '#EAEAEA', marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  stockToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stockToggleText: { fontSize: 16, color: '#4B5563', fontWeight: '600' },
  stockToggleTextActive: { color: '#496943' },

  sheetFooter: { flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderColor: '#EAEAEA' },
  clearBtn: { flex: 1, paddingVertical: 18, borderRadius: 20, backgroundColor: '#EAEAEA', alignItems: 'center' },
  clearBtnText: { color: '#4B5563', fontWeight: 'bold', fontSize: 16 },
  applyBtn: { flex: 1.5, paddingVertical: 18, borderRadius: 20, backgroundColor: '#496943', alignItems: 'center' },
  applyBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});