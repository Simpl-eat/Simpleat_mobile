import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

function formatRegisterError(message: string) {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'Cet email est deja utilise.';
  }
  if (m.includes('password')) {
    return 'Le mot de passe est invalide.';
  }
  if (m.includes('email')) {
    return 'L email fourni est invalide.';
  }
  return 'Impossible de creer le compte. Reessaie.';
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit =
      !loading && email.includes('@') && password.length >= 6;

  async function handleRegister() {
    try {
      setLoading(true);
      setErrorMessage(null);

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (authError) {
        setErrorMessage(formatRegisterError(authError.message));
        return;
      }

      const emailAlreadyUsed = data.user?.identities?.length === 0;
      if (emailAlreadyUsed) {
        setErrorMessage('Cet email est deja utilise. Connecte-toi ou utilise un autre email.');
        return;
      }

      if (!data.session) {
        router.replace({
          pathname: '/login',
          params: { registered: '1' },
        });
        return;
      }

      router.replace('/suggestions');
    } catch (e: unknown) {
      setErrorMessage(
          e instanceof Error ? formatRegisterError(e.message) : 'Une erreur est survenue.',
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
            <Text style={styles.title}>Inscription</Text>
            <Text style={styles.subtitle}>
              Crée ton compte avec ton email. Tu compléteras ton profil après la
              première connexion.
            </Text>

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
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="toi@email.com"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Mot de passe (min. 6 car.)
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                    placeholder="Ton mot de passe"
                    placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                  <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
                onPress={handleRegister}
                disabled={!canSubmit}
                style={[
                  styles.button,
                  !canSubmit && styles.buttonDisabled,
                ]}
            >
              {loading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <Text style={styles.buttonText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push('/login')}
                disabled={loading}
                style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                Déjà un compte ?{' '}
                <Text style={styles.linkTextStrong}>Se connecter</Text>
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
  card: { gap: 16, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: 4, color: '#1F2937' },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 6, lineHeight: 20, color: '#6B7280' },
  mascot: { width: 190, height: 190 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#111111', borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#111111' },
  eyeIcon: { paddingHorizontal: 14 },
  button: { marginTop: 10, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#496943' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkButton: { marginTop: 10, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#6B7280' },
  linkTextStrong: { color: '#1F2937', fontWeight: '700' },
  errorBox: { borderWidth: 1, borderRadius: 14, padding: 12, borderColor: '#FFD7D7', backgroundColor: '#FFF0F0' },
  errorText: { fontSize: 14, color: '#E55353' },
});