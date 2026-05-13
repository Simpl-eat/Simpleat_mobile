import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

function formatAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Identifiants invalides.';
  if (m.includes('email not confirmed'))
    return 'Email non confirmé. Vérifie ta boîte mail.';
  if (
      m.includes('missing email') ||
      m.includes('email') ||
      m.includes('password')
  )
    return 'Email ou mot de passe incorrect.';
  return 'Impossible de se connecter. Réessaie.';
}

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ registered?: string }>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = !loading && email.trim().length > 0 && password.length > 0;

  useEffect(() => {
    if (params.registered === '1') {
      setInfoMessage(
          'Un email de vérification a été envoyé. Merci de confirmer ton adresse puis de te connecter.',
      );
    }
  }, [params.registered]);

  async function handleLogin() {
    if (!canSubmit) {
      setErrorMessage('Renseigne ton email et ton mot de passe.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(formatAuthError(error.message));
        return;
      }

      if (!data.session) {
        setErrorMessage(
            'Connexion réussie, mais session introuvable. Réessaie.',
        );
        return;
      }

      router.replace('/suggestions');
    } catch (error: unknown) {
      setErrorMessage(
          error instanceof Error ? error.message : 'Une erreur est survenue.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
      <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: Math.max(20, insets.top + 8) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.mascotWrapper}>
            <Image
                source={require('@/assets/images/broco_waving.png')}
                style={styles.mascot}
                resizeMode="contain"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>
              Connecte-toi à ton compte Simpl&apos;eat
            </Text>

            {infoMessage ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>{infoMessage}</Text>
                </View>
            ) : null}

            {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ex: toi@email.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ton mot de passe"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  textContentType="password"
                  style={styles.input}
              />
            </View>

            <TouchableOpacity
                onPress={handleLogin}
                disabled={!canSubmit}
                style={[
                  styles.button,
                  !canSubmit && styles.buttonDisabled,
                ]}
            >
              {loading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push('/register')}
                disabled={loading}
                style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                Pas de compte ?{' '}
                <Text style={styles.linkTextStrong}>Créer un compte</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EA' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 40 },
  mascotWrapper: { alignItems: 'center', marginBottom: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center', color: '#1F2937' },
  subtitle: { fontSize: 15, textAlign: 'center', color: '#6B7280', marginBottom: 2 },
  mascot: { width: 190, height: 190 },
  infoBox: { borderRadius: 14, padding: 12, backgroundColor: '#E8F6EC', borderWidth: 1, borderColor: '#CFEAD7' },
  infoText: { fontSize: 14, lineHeight: 20, color: '#1E5F39' },
  errorBox: { borderWidth: 1, borderRadius: 14, padding: 12, borderColor: '#FFD7D7', backgroundColor: '#FFF0F0' },
  errorText: { fontSize: 14, color: '#E55353' },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#111111', backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  button: { marginTop: 6, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#496943' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkButton: { paddingVertical: 8, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#6B7280' },
  linkTextStrong: { fontWeight: '700', color: '#1F2937' },
});