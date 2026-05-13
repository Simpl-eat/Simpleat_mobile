import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { intervalToMinutes } from '@/hooks/useFilteredRecipes';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types/recipe';

type RecipeCardProps = {
  recipe: Recipe;
  preference: boolean | undefined;
  viewMode?: 'list' | 'grid'; // NOUVEAU : Gère l'affichage
  onPress: () => void;
  onLike: () => void;
  onDislike: () => void;
};

function formatTime(interval: string | null): string | null {
  const minutes = intervalToMinutes(interval);
  if (minutes === null) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function RecipeCard({ recipe, preference, viewMode = 'list', onPress, onLike, onDislike }: RecipeCardProps) {
  const time = formatTime(recipe.total_time);
  const isGrid = viewMode === 'grid';

  const imageUrl = recipe.id
    ? supabase.storage.from("img-recette").getPublicUrl(`${recipe.id}.jpg`).data.publicUrl
    : "https://via.placeholder.com/400x300";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card, 
        isGrid ? styles.cardGrid : styles.cardList,
        pressed && styles.cardPressed
      ]}
    >
      {/* IMAGE */}
      {imageUrl ? (
        <Image 
          source={{ uri: imageUrl }} 
          style={isGrid ? styles.imageGrid : styles.imageList} 
          resizeMode="cover" 
        />
      ) : (
        <View style={isGrid ? styles.imagePlaceholderGrid : styles.imagePlaceholderList}>
          <Ionicons name="fast-food-outline" size={36} color="#A8C699" />
        </View>
      )}

      {/* CONTENU */}
      <View style={[styles.body, isGrid && styles.bodyGrid]}>
        <Text style={[styles.title, isGrid && styles.titleGrid]} numberOfLines={2}>
          {recipe.name_fr ?? recipe.name}
        </Text>

        <View style={styles.meta}>
          {time && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{time}</Text>
            </View>
          )}
        </View>

        {/* ACTIONS (Likes) */}
        <View style={styles.actions}>
          <Pressable onPress={onDislike} hitSlop={10} style={styles.actionBtn}>
            <Ionicons
              name={preference === false ? 'thumbs-down' : 'thumbs-down-outline'}
              size={20}
              color={preference === false ? '#6B7280' : '#D1D5DB'}
            />
          </Pressable>
          <Pressable onPress={onLike} hitSlop={10} style={styles.actionBtn}>
            <Ionicons
              name={preference === true ? 'heart' : 'heart-outline'}
              size={22}
              color={preference === true ? '#E55353' : '#9CA3AF'}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85 },
  
  // Mode Ligne (Défaut)
  cardList: { flexDirection: 'row' },
  imageList: { width: 110, height: '100%', minHeight: 120 },
  imagePlaceholderList: { width: 110, minHeight: 120, backgroundColor: '#F0F5EC', alignItems: 'center', justifyContent: 'center' },
  
  // Mode Grille
  cardGrid: { flexDirection: 'column' },
  imageGrid: { width: '100%', height: 130 },
  imagePlaceholderGrid: { width: '100%', height: 130, backgroundColor: '#F0F5EC', alignItems: 'center', justifyContent: 'center' },

  body: { flex: 1, padding: 12, justifyContent: 'space-between' },
  bodyGrid: { padding: 10 },
  
  title: { fontSize: 15, fontWeight: '700', color: '#1F2937', lineHeight: 20, marginBottom: 6 },
  titleGrid: { fontSize: 14, marginBottom: 8 },
  
  meta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, alignItems: 'center' },
  actionBtn: { padding: 4 },
});