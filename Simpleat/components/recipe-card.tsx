import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { intervalToMinutes } from '@/hooks/useFilteredRecipes';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/lib/types/recipe';

type RecipeCardProps = {
  recipe: Recipe;
  /** true = liked, false = disliked, undefined = no preference */
  preference: boolean | undefined;
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

export function RecipeCard({ recipe, preference, onPress, onLike, onDislike }: RecipeCardProps) {
  const time = formatTime(recipe.total_time);

  // URL image depuis bucket Supabase
  const imageUrl = recipe.id
    ? supabase.storage.from("img-recette").getPublicUrl(`${recipe.id}.jpg`).data
        .publicUrl
    : "https://via.placeholder.com/400x300";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MaterialCommunityIcons name="food" size={36} color="#A8C699" />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.name_fr ?? recipe.name}
        </Text>

        <View style={styles.meta}>
          {time && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={13} color="#6B7280" />
              <Text style={styles.metaText}>{time}</Text>
            </View>
          )}
          {recipe.lunch_type && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={13} color="#6B7280" />
              <Text style={styles.metaText}>{recipe.lunch_type}</Text>
            </View>
          )}
        </View>

        {recipe.str_category ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {recipe.str_category}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onLike} hitSlop={8} style={styles.actionBtn}>
          <MaterialCommunityIcons
            name={preference === true ? 'heart' : 'heart-outline'}
            size={22}
            color={preference === true ? '#E55353' : '#9CA3AF'}
          />
        </Pressable>
        <Pressable onPress={onDislike} hitSlop={8} style={styles.actionBtn}>
          <MaterialCommunityIcons
            name={preference === false ? 'thumb-down' : 'thumb-down-outline'}
            size={20}
            color={preference === false ? '#6B7280' : '#D1D5DB'}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardPressed: {
    opacity: 0.85,
  },
  image: {
    width: 100,
    height: '100%',
    minHeight: 100,
  },
  imagePlaceholder: {
    width: 100,
    minHeight: 100,
    backgroundColor: '#F0F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: 12,
    gap: 6,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F0F5EC',
  },
  badgeText: {
    fontSize: 11,
    color: '#4A6332',
    fontWeight: '500',
  },
  actions: {
    paddingVertical: 10,
    paddingRight: 10,
    justifyContent: 'center',
    gap: 12,
    alignItems: 'center',
  },
  actionBtn: {
    padding: 4,
  },
});
