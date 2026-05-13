import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const SLIDES = [
  {
    id: '1',
    icon: 'restaurant-outline',
    title: "Simpl'eat",
    subtitle: "Assistant Culinaire",
    description: "Une expérience intuitive pensée pour transformer votre cuisine du quotidien grâce à l'IA.",
    image: require('../assets/images/broco_waving.png'),
    steps: ["Personnalisation", "Objectifs santé", "Régimes"]
  },
  {
    id: '2',
    icon: 'basket-outline',
    title: "Ma Cuisine",
    subtitle: "Gestion du Stock",
    description: "Renseignez vos ingrédients manuellement ou via scan. L'IA utilise ce que vous avez déjà.",
    image: require('../assets/images/broco_cooking.png'),
    steps: ["Scan code-barres", "Inventaire vivant", "Anti-gaspillage"]
  },
  {
    id: '3',
    icon: 'sparkles-outline',
    title: "Suggestions",
    subtitle: "Intelligence Artificielle",
    description: "Découvrez des recettes générées selon vos envies du moment et le temps dont vous disposez.",
    image: require('../assets/images/broco_tasting.png'),
    steps: ["Tinder Food Effect", "Favoris ❤️", "Sur-mesure"]
  },
  {
    id: '4',
    icon: 'list-outline',
    title: "Organisation",
    subtitle: "Courses & Fiches",
    description: "Accédez aux fiches détaillées et générez automatiquement votre liste de courses intelligente.",
    image: require('../assets/images/broco_waving.png'),
    steps: ["Fiches nutritionnelles", "Liste auto", "Planification"]
  }
];

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);

  const colors = {
    background: '#F7F3EA',
    card: '#FFFFFF',
    textMain: '#1F2937',
    textSecondary: '#6B7280',
    primary: '#496943',
    accent: '#F9AB24',
    border: '#E5E7EB',
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0], index: number }) => {
    return (
        <View style={[styles.slideContainer, { width }]}>
          <View style={styles.card}>
            {/* Header de la carte avec Icône Pro */}
            <View style={styles.iconHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
                <Ionicons name={item.icon as any} size={28} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
            </View>

            <View style={styles.imageWrapper}>
              <Image source={item.image} style={styles.mascotImg} resizeMode="contain" />
            </View>

            <Text style={styles.descriptionText}>{item.description}</Text>

            <View style={styles.stepsContainer}>
              {item.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
              ))}
            </View>
          </View>
        </View>
    );
  };

  return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ImageBackground
            source={require('../assets/images/fond_picto_all.png')}
            style={styles.backgroundImage}
            imageStyle={{ opacity: 0.1 }}
        >
          <SafeAreaView style={styles.container}>

            <View style={styles.topHeader}>
              <Text style={styles.brandTitle}>Simpl'<Text style={{color: colors.accent}}>eat</Text></Text>
            </View>

            <Animated.FlatList
                data={SLIDES}
                keyExtractor={(item) => item.id}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
            />

            <View style={styles.pagination}>
              {SLIDES.map((_, i) => {
                const dotStyle = useAnimatedStyle(() => {
                  const isActive = interpolate(
                      scrollX.value,
                      [(i - 1) * width, i * width, (i + 1) * width],
                      [10, 25, 10],
                      Extrapolation.CLAMP
                  );
                  return { width: isActive, opacity: interpolate(scrollX.value, [(i - 1) * width, i * width, (i + 1) * width], [0.4, 1, 0.4], Extrapolation.CLAMP) };
                });
                return <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.primary }, dotStyle]} />;
              })}
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <TouchableOpacity
                  style={[styles.btnMain, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/register')}
              >
                <Text style={styles.btnMainText}>Créer un profil</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={styles.btnAlt}
                  onPress={() => router.push('/login')}
              >
                <Text style={styles.btnAltText}>Se connecter</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </ImageBackground>
      </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backgroundImage: { flex: 1 },
  container: { flex: 1 },
  topHeader: { alignItems: 'center', paddingTop: 20 },
  brandTitle: { fontSize: 24, fontWeight: '800', color: '#496943', letterSpacing: 1 },

  slideContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25 },
  card: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#496943',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  iconHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  cardSubtitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937' },

  imageWrapper: { height: 160, alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  mascotImg: { width: 140, height: 140 },

  descriptionText: { fontSize: 16, color: '#4B5563', lineHeight: 24, marginBottom: 20 },

  stepsContainer: { gap: 10, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  pagination: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 30 },
  dot: { height: 8, borderRadius: 4 },

  footer: { paddingHorizontal: 25, paddingBottom: 40, gap: 12 },
  btnMain: { paddingVertical: 18, borderRadius: 22, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  btnMainText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  btnAlt: { paddingVertical: 15, alignItems: 'center' },
  btnAltText: { color: '#4B5563', fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
});