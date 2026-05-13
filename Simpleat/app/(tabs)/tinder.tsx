import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRecipePreferences } from '@/hooks/useRecipePreference';
import { useTinderRecipes } from '@/hooks/useTinderRecipes';
import { supabase } from '@/lib/supabase';
import { ThemedView } from '@/components/themed-view';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export default function TinderFoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { recipes, isLoading, refetch } = useTinderRecipes();
  const { togglePreference } = useRecipePreferences();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  // --- CORRECTION DU BLOCAGE (STALE CLOSURE) ---
  // On utilise des refs pour que le PanResponder ait toujours accès aux dernières données 
  // sans avoir besoin d'être recréé à chaque swipe.
  const currentIndexRef = useRef(currentIndex);
  const recipesRef = useRef(recipes);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    recipesRef.current = recipes;
  }, [recipes]);

  // --- ACTIONS DE FIN DE SWIPE ---
  const onSwipeComplete = useCallback((direction: 'right' | 'left') => {
    const idx = currentIndexRef.current;
    const currentRecipe = recipesRef.current[idx];
    
    if (currentRecipe && currentRecipe.id) {
      const isLiked = direction === 'right';
      // On sauvegarde en arrière-plan sans bloquer l'UI
      togglePreference(currentRecipe.id, isLiked).catch((err) => {
        console.error("Erreur lors du like/dislike :", err);
      });
    }

    // On prépare la carte suivante
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(idx + 1);
  }, [position, togglePreference]);

  // --- FORCER LE SWIPE (Boutons manuels ou fin de geste) ---
  const forceSwipe = useCallback((direction: 'right' | 'left') => {
    // CORRECTION : On éjecte la carte beaucoup plus loin (x2) pour qu'elle sorte bien de l'écran du tel
    const x = direction === 'right' ? SCREEN_WIDTH * 2 : -SCREEN_WIDTH * 2;
    
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 200, // Plus rapide pour un meilleur feeling
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  }, [position, onSwipeComplete]);

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  }, [position]);

  // --- GESTION DU SWIPE (Moteur natif React Native) ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  // --- RECHARGER QUAND LA PILE EST VIDE ---
  useEffect(() => {
    if (currentIndex >= recipes.length && recipes.length > 0) {
      setCurrentIndex(0);
      refetch();
    }
  }, [currentIndex, recipes.length, refetch]);


  // --- ANIMATIONS D'INCLINAISON ET D'OPACITÉ ---
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const rotateAndTranslate = {
    transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // --- RENDU DES CARTES ---
  const renderCards = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="#FF5864" style={{ marginTop: 100 }} />;
    }

    if (currentIndex >= recipes.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Plus de recettes pour le moment !</Text>
          <Pressable style={styles.reloadBtn} onPress={() => refetch()}>
            <Text style={styles.reloadBtnText}>Recharger</Text>
          </Pressable>
        </View>
      );
    }

    return recipes.map((item, i) => {
      if (i < currentIndex) return null;

      const imageUrl = supabase.storage.from("img-recette").getPublicUrl(`${item.id}.jpg`).data.publicUrl;

      if (i === currentIndex) {
        return (
          <Animated.View
            {...panResponder.panHandlers}
            key={item.id}
            style={[rotateAndTranslate, styles.cardStyle]}
          >
            <Animated.View style={[styles.stampContainer, styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={styles.likeText}>Miam !</Text>
            </Animated.View>
            
            <Animated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeText}>Bof...</Text>
            </Animated.View>

            <Image source={{ uri: imageUrl }} style={styles.cardImage} />
            <View style={styles.cardFooter}>
              <Text style={styles.recipeTitle}>{item.name_fr}</Text>
            </View>
          </Animated.View>
        );
      }

      return (
        <Animated.View key={item.id} style={[styles.cardStyle, { zIndex: -i }]}>
          <Image source={{ uri: imageUrl }} style={styles.cardImage} />
          <View style={styles.cardFooter}>
            <Text style={styles.recipeTitle}>{item.name_fr}</Text>
          </View>
        </Animated.View>
      );
    }).reverse();
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#FF5864" />
        </Pressable>
        <Ionicons name="flame" size={32} color="#FF5864" />
        <View style={styles.spacer} />
      </View>

      <View style={styles.cardsContainer}>
        {renderCards()}
      </View>

      <View style={styles.bottomActions}>
        <Pressable style={[styles.actionBtn, styles.btnNope]} onPress={() => forceSwipe('left')}>
          <Ionicons name="close" size={32} color="#FF6D6D" />
        </Pressable>
        
        <Pressable style={[styles.actionBtn, styles.btnLike]} onPress={() => forceSwipe('right')}>
          <Ionicons name="heart" size={32} color="#496943" />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3EA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  spacer: { width: 40 },
  
  cardsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -20 },
  
  cardStyle: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: '95%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cardImage: { flex: 1, borderRadius: 24, resizeMode: 'cover' },
  cardFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    padding: 24,
  },
  recipeTitle: { color: '#FFF', fontSize: 26, fontWeight: '800' },

  stampContainer: { position: 'absolute', zIndex: 10, top: 50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 4, transform: [{ rotate: '-15deg' }] },
  likeStamp: { left: 40, borderColor: '#496943' },
  nopeStamp: { right: 40, borderColor: '#FF6D6D', transform: [{ rotate: '15deg' }] },
  likeText: { color: '#496943', fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  nopeText: { color: '#FF6D6D', fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },

  bottomActions: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginBottom: 40 },
  actionBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  btnNope: { borderWidth: 2, borderColor: '#FFE0E0' },
  btnLike: { borderWidth: 2, borderColor: '#E5F0E1' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 20 },
  reloadBtn: { backgroundColor: '#FF5864', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  reloadBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});