import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLikedRecipes, type RecipeWithMacros } from '@/hooks/useLikedRecipes'; // NOUVEAU HOOK
import { useRecipePreferences } from '@/hooks/useRecipePreference';
import { supabase } from '@/lib/supabase';

export default function MesLikesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { togglePreference } = useRecipePreferences();
  
  // Utilisation du nouveau hook !
  const { recipes: likedRecipes, isLoading, refetch: refetchRecipes } = useLikedRecipes(search);

  const fmt = (val: number | undefined | null) => 
    val != null && val > 0 ? `${Math.round(val)}g` : '--g';

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchRecipes();
    setRefreshing(false);
  };

  const handleUnlike = async (id: number) => {
    // 1. Enlever la préférence en BDD
    await togglePreference(id, false);
    // 2. Recharger la liste pour la mettre à jour
    await refetchRecipes();
  };

  const goToRecipe = useCallback((id: number) => {
    router.push({
      pathname: '/(tabs)/(protected)/receipe/[id]' as any,
      params: { id: String(id) },
    });
  }, [router]);

  const renderRecipe = ({ item }: { item: RecipeWithMacros }) => {
    const imageUrl = supabase.storage.from('img-recette').getPublicUrl(`${item.id}.jpg`).data.publicUrl;
    const isGrid = viewMode === 'grid';

    const nutritionItems = [
      { label: 'lipides', value: fmt(item.macros?.fat), bg: '#F5D90A', text: '#111111' },
      { label: 'protéines', value: fmt(item.macros?.protein), bg: '#FF6D6D', text: '#FFFFFF' },
      { label: 'glucides', value: fmt(item.macros?.carbohydrates), bg: '#F9AB24', text: '#111111' },
      { label: 'fibres', value: fmt(item.macros?.fiber), bg: '#3F6E3C', text: '#FFFFFF' },
    ];

    return (
      <Pressable 
        style={[styles.card, isGrid ? styles.cardGrid : styles.cardList]} 
        onPress={() => goToRecipe(item.id)}
      >
        <View style={isGrid ? styles.imageContainerGrid : styles.imageContainerList}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image} 
          />
          <Pressable 
            style={styles.unlikeButton}
            hitSlop={10} 
            onPress={() => handleUnlike(item.id)}
          >
            <Ionicons name="heart" size={20} color="#FF6D6D" />
          </Pressable>
        </View>
        
        <View style={styles.cardContent}>
          <View style={[styles.macrosRow, !isGrid && styles.macrosRowList]}>
            {nutritionItems.map((macro) => (
              <View key={macro.label} style={[styles.macroBubble, { backgroundColor: macro.bg }]}>
                <ThemedText style={[styles.macroValue, { color: macro.text }]}>{macro.value}</ThemedText>
                <ThemedText style={[styles.macroLabel, { color: macro.text }]}>{macro.label}</ThemedText>
              </View>
            ))}
          </View>

          <ThemedText style={styles.recipeTitle} numberOfLines={2}>
            {item.name_fr}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Image 
            source={require('@/assets/images/broco_tasting.png')} 
            style={styles.mascotIcon} 
            resizeMode="contain" 
          />
          <ThemedText type="title" style={styles.headerTitle}>Mes recettes likées</ThemedText>
        </View>

        <View style={styles.toolsRow}>
          <View style={styles.searchContainer}>
            <SearchBar value={search} onChangeText={setSearch} />
          </View>
          
          <Pressable 
            style={styles.viewToggleBtn}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons 
              name={viewMode === 'grid' ? "list" : "grid"} 
              size={22} 
              color="#496943" 
            />
          </Pressable>
        </View>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#496943" />
        </View>
      ) : likedRecipes.length === 0 ? (
        <ScrollView contentContainerStyle={styles.centered} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <Ionicons name="heart-dislike-outline" size={64} color="#C4C4C4" />
          <ThemedText style={styles.emptyTitle}>Aucune recette trouvée</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            {search.length > 0 
              ? "Aucun de tes likes ne correspond à cette recherche." 
              : "Tu n'as pas encore liké de recettes !"}
          </ThemedText>
        </ScrollView>
      ) : (
        <FlatList
          key={viewMode}
          data={likedRecipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRecipe}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  mascotIcon: { width: 40, height: 40 },
  headerTitle: { fontSize: 26, color: '#496943', fontWeight: 'bold' },
  toolsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchContainer: { flex: 1 },
  viewToggleBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#F3F4E9', alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#496943', marginTop: 16 },
  emptySubtitle: { textAlign: 'center', color: '#666666', marginTop: 8, lineHeight: 22 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  row: { justifyContent: 'space-between' },
  card: { backgroundColor: '#EBE9DF', borderRadius: 18, marginBottom: 20 },
  cardGrid: { width: '48%' },
  cardList: { width: '100%' },
  imageContainerGrid: { width: '100%', height: 140 },
  imageContainerList: { width: '100%', height: 200 },
  image: { width: '100%', height: '100%', borderTopLeftRadius: 18, borderTopRightRadius: 18, resizeMode: 'cover' },
  unlikeButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255, 255, 255, 0.8)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: 12, alignItems: 'center' },
  macrosRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: -28, marginBottom: 10 },
  macrosRowList: { gap: 12 },
  macroBubble: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  macroValue: { fontSize: 11, fontWeight: '800', lineHeight: 12 },
  macroLabel: { fontSize: 7, fontWeight: '600' },
  recipeTitle: { color: '#496943', fontWeight: '700', fontSize: 14, textAlign: 'center', marginBottom: 4 },
});