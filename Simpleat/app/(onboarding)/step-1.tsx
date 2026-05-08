import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function OnboardingStep1Screen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const colors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#111',
    muted: isDark ? '#A1A1AA' : '#666',
    primary: '#4CAF50',
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Bienvenue sur Simpl&apos;eat
      </Text>
      <Text style={[styles.body, { color: colors.muted }]}>
        En quelques étapes, nous allons personnaliser ton expérience : ton pseudo,
        ton régime alimentaire et tes objectifs. Tu pourras tout modifier plus tard
        dans les réglages.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/step-2')}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Commencer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
