import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Modal, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChips } from '@/components/filter-chips';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLikedRecipes, type RecipeWithMacros } from '@/hooks/useLikedRecipes';
import { useRecipePreferences } from '@/hooks/useRecipePreference';
import { supabase } from '@/lib/supabase';
// CORRECTION 2 : Import du type TimeFilter
import { type TimeFilter } from '@/hooks/useFilteredRecipes';

// Helper pour formater les labels (petit_dejeuner -> Petit dejeuner)
function formatLabel(raw: string) {
  if (!raw) return '';
  return raw.replace(/_/g, ' ').charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export default function MesLikesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDislikes, setShowDislikes] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  // CORRECTION 2 : On utilise bien TimeFilter
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);
  const [lunchType, setLunchType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);

  const { togglePreference } = useRecipePreferences();
  
  // Utilisation des filtres dans le hook
  const activeFilters = useMemo(() => ({
    search, timeFilter, lunchType, category, area
  }), [search, timeFilter, lunchType, category, area]);

  const { recipes, isLoading, filterOptions, refetch } = useLikedRecipes(activeFilters, !showDislikes);

  const activeCount = useMemo(() => {
    let count = 0;
    if (timeFilter) count++; if (lunchType) count++;
    if (category) count++; if (area) count++;
    return count;
  }, [timeFilter, lunchType, category, area]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderItem = useCallback(({ item }: { item: RecipeWithMacros }) => {
    const imageUrl = supabase.storage.from('img-recette').getPublicUrl(`${item.id}.jpg`).data.publicUrl;
    const isGrid = viewMode === 'grid';

    const nutrition = [
      { label: 'lipides', value: Math.round(item.macros?.fat || 0) + 'g', bg: '#F5D90A' },
      { label: 'protéines', value: Math.round(item.macros?.protein || 0) + 'g', bg: '#FF6D6D' },
      { label: 'glucides', value: Math.round(item.macros?.carbohydrates || 0) + 'g', bg: '#F9AB24' },
      { label: 'fibres', value: Math.round(item.macros?.fiber || 0) + 'g', bg: '#3F6E3C' },
    ];

    return (
      <Pressable style={[styles.card, isGrid ? styles.cardGrid : styles.cardList]} onPress={() => router.push(`/(tabs)/(protected)/receipe/${item.id}` as any)}>
        <View style={isGrid ? styles.imageGrid : styles.imageList}>
          <Image source={{ uri: imageUrl }} style={styles.img} />
          <Pressable style={styles.heartBtn} onPress={() => togglePreference(item.id, !showDislikes).then(refetch)}>
            <Ionicons name={showDislikes ? "thumbs-down" : "heart"} size={20} color={showDislikes ? "#6B7280" : "#FF6D6D"} />
          </Pressable>
        </View>
        <View style={[styles.cardContent, !isGrid && styles.cardContentList]}>
          <View style={[styles.macroRow, !isGrid && styles.macroRowList]}>
            {nutrition.map(n => (
              <View key={n.label} style={[styles.bubble, { backgroundColor: n.bg }]}>
                <Text style={styles.bubbleVal}>{n.value}</Text>
                <Text style={styles.bubbleLab}>{n.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.recipeTitle} numberOfLines={2}>{item.name_fr}</Text>
        </View>
      </Pressable>
    );
  }, [viewMode, showDislikes, refetch, togglePreference]);

  return (
    <ThemedView style={[styles.container, { paddingTop: Math.max(0, insets.top - 15) }]}>
      {/* HEADER FIXE */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.row}>
            <Image source={require('@/assets/images/broco_tasting.png')} style={styles.mascot} />
            <ThemedText type="title" style={styles.title}>{showDislikes ? "Mes dislikés" : "Mes likes"}</ThemedText>
          </View>
          <Pressable style={styles.toggleType} onPress={() => setShowDislikes(!showDislikes)}>
            <Ionicons name={showDislikes ? "heart-outline" : "thumbs-down-outline"} size={24} color="#496943" />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}><SearchBar value={search} onChangeText={setSearch} /></View>
          <Pressable style={styles.viewBtn} onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <Ionicons name={viewMode === 'grid' ? "list" : "grid"} size={22} color="#496943" />
          </Pressable>
        </View>

        <Pressable style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]} onPress={() => setIsFilterOpen(true)}>
          <Ionicons name="options-outline" size={20} color={activeCount > 0 ? "#FFF" : "#496943"} />
          <Text style={[styles.filterText, activeCount > 0 && { color: '#FFF' }]}>Filtres {activeCount > 0 ? `(${activeCount})` : ''}</Text>
        </Pressable>
      </View>

      {/* LISTE ET ÉTATS VIDES */}
      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#496943" />
        </View>
      ) : recipes.length === 0 ? (
        <ScrollView contentContainerStyle={styles.centered} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#496943']} tintColor={'#496943'} />}>
          <Ionicons name={showDislikes ? "thumbs-down-outline" : "heart-dislike-outline"} size={64} color="#C4C4C4" />
          <ThemedText style={styles.emptyTitle}>Aucune recette trouvée</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            {search.length > 0 
              ? "Aucun résultat ne correspond à cette recherche." 
              : showDislikes 
                ? "Tu n'as pas encore disliké de recettes !" 
                : "Tu n'as pas encore liké de recettes !"}
          </ThemedText>
        </ScrollView>
      ) : (
        <FlatList
          key={viewMode}
          data={recipes}
          renderItem={renderItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.list}
          columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between' } : undefined}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#496943']} tintColor={'#496943'} />}
        />
      )}

      {/* BOTTOM SHEET FILTRES */}
      <Modal visible={isFilterOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setIsFilterOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Filtres avancés</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <FilterChips label="Temps" options={[{key:'15',label:'< 15 min'},{key:'30',label:'< 30 min'},{key:'60',label:'< 1 h'},{key:'60+',label:'> 1 h'}]} selected={timeFilter} onSelect={(val) => setTimeFilter(val as TimeFilter)} />
              <FilterChips label="Type de repas" options={filterOptions.lunchTypes.map(v=>({key:v,label:formatLabel(v)}))} selected={lunchType} onSelect={setLunchType} />
              <FilterChips label="Catégorie" options={filterOptions.categories.map(v=>({key:v,label:formatLabel(v)}))} selected={category} onSelect={setCategory} />
              <FilterChips label="Origine" options={filterOptions.areas.map(v=>({key:v,label:formatLabel(v)}))} selected={area} onSelect={setArea} />
            </ScrollView>
            <View style={styles.sheetFooter}>
              <Pressable style={styles.clear} onPress={() => { setTimeFilter(null); setLunchType(null); setCategory(null); setArea(null); }}><Text style={styles.clearText}>Réinitialiser</Text></Pressable>
              <Pressable style={styles.apply} onPress={() => setIsFilterOpen(false)}><Text style={styles.applyText}>Voir les résultats</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3EA' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mascot: { width: 65, height: 65 },
  //<title: { fontSize: 28, color: '#496943', fontWeight: '800' },
  title: { fontSize: 30, fontWeight: '800', color: '#1F2937' },
  toggleType: { padding: 10, backgroundColor: '#EBE9DF', borderRadius: 20 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  viewBtn: { padding: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: '#496943' },
  filterText: { fontWeight: '600', color: '#496943' },
  
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#496943', marginTop: 16 },
  emptySubtitle: { textAlign: 'center', color: '#666666', marginTop: 8, lineHeight: 22 },

  list: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: '#EBE9DF', borderRadius: 18, marginBottom: 16, overflow: 'hidden' },
  cardGrid: { width: '48%', flexDirection: 'column' },
  cardList: { width: '100%', flexDirection: 'row', height: 120 },
  
  imageGrid: { width: '100%', height: 140 },
  imageList: { width: 120, height: '100%' },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  heartBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 15 },
  
  cardContent: { padding: 10, alignItems: 'center', flex: 1 },
  cardContentList: { justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 16 },
  
  macroRow: { flexDirection: 'row', gap: 4, marginTop: -25, marginBottom: 8 },
  macroRowList: { marginTop: 0, gap: 8 },
  
  bubble: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  bubbleVal: { fontSize: 10, fontWeight: '800' },
  bubbleLab: { fontSize: 6 },
  recipeTitle: { color: '#496943', fontWeight: '700', textAlign: 'center', fontSize: 14 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#F7F3EA', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, height: '75%' },
  handle: { width: 40, height: 5, backgroundColor: '#D1D5DB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111' },
  sheetFooter: { flexDirection: 'row', gap: 12, marginTop: 15, borderTopWidth: 1, borderColor: '#EAEAEA', paddingTop: 20 },
  clear: { flex: 1, paddingVertical: 16, backgroundColor: '#EBE9DF', borderRadius: 16, alignItems: 'center' },
  clearText: { color: '#6B7280', fontWeight: 'bold', fontSize: 16 },
  apply: { flex: 1.5, paddingVertical: 16, backgroundColor: '#496943', borderRadius: 16, alignItems: 'center' },
  applyText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});