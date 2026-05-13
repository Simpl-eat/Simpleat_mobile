import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingStep1Screen() {
  const router = useRouter();

  return (
      <View style={styles.screen}>
        <ImageBackground
            source={require('../../assets/images/fond_picto_all.png')}
            style={styles.backgroundImage}
            imageStyle={{ opacity: 0.08 }}
        >
          <View style={styles.container}>
            <View style={styles.card}>
              <View style={styles.iconHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="sparkles-outline" size={28} color="#496943" />
                </View>
              </View>

              <View style={styles.imageWrapper}>
                <Image
                    source={require('../../assets/images/broco_waving.png')}
                    style={styles.mascotImg}
                    resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Bienvenue sur Simpl'<Text style={{color: '#F9AB24'}}>eat</Text></Text>

              <Text style={styles.descriptionText}>
                En quelques étapes, nous allons personnaliser ton expérience : ton pseudo,
                ton régime alimentaire et tes objectifs.
              </Text>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>Tu pourras tout modifier plus tard dans les réglages de ton profil.</Text>
              </View>

              <TouchableOpacity
                  style={styles.btnMain}
                  onPress={() => router.push('/step-2')}
                  accessibilityRole="button"
              >
                <Text style={styles.btnMainText}>C'est parti !</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EA' },
  backgroundImage: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  card: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, shadowColor: '#496943', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  iconHeader: { alignItems: 'center', marginBottom: 10 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F7F3EA', alignItems: 'center', justifyContent: 'center' },

  imageWrapper: { height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  mascotImg: { width: 120, height: 120 },

  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 12 },
  descriptionText: { fontSize: 16, color: '#4B5563', lineHeight: 24, textAlign: 'center', marginBottom: 20 },

  infoBox: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 16, gap: 10, alignItems: 'center', marginBottom: 30 },
  infoText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 20 },

  btnMain: { backgroundColor: '#496943', paddingVertical: 18, borderRadius: 22, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  btnMainText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});