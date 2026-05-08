import { useRouter } from 'expo-router';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function Index() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  const colors = {
    background: isDark ? '#000' : '#fff',
    card: isDark ? '#0B0B0B' : '#F9FAFB',
    text: isDark ? '#fff' : '#111',
    muted: isDark ? '#A1A1AA' : '#666',
    primary: '#4CAF50',
    border: isDark ? '#2A2A2A' : '#E5E7EB',
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Bienvenue sur Simpl&apos;eat</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Crée ton compte pour commencer, ou connecte-toi si tu en as déjà un.
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.primaryButtonText}>Créer un compte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Se connecter
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});