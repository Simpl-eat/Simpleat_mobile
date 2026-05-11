import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

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
  const isDark = useColorScheme() === 'dark';

  const colors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#111',
    muted: isDark ? '#A1A1AA' : '#666',
    border: isDark ? '#2A2A2A' : '#ddd',
    inputBg: isDark ? '#0B0B0B' : '#fff',
    primary: '#4CAF50',
  };

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

      // Supabase peut retourner session=null sans erreur pour un email deja existant.
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
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>Inscription</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Crée ton compte avec ton email. Tu compléteras ton profil après la
            première connexion.
          </Text>

          {errorMessage ? (
            <View style={[styles.errorBox, { borderColor: colors.border }]}>
              <Text style={[styles.errorText, { color: colors.text }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="toi@email.com"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>
              Mot de passe (min. 6 car.)
            </Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={[styles.passwordInput, { color: colors.text }]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={!canSubmit}
            style={[
              styles.button,
              { backgroundColor: colors.primary },
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
            <Text style={[styles.linkText, { color: colors.muted }]}>
              Déjà un compte ?{' '}
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                Se connecter
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { gap: 16 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 14,
  },
  button: {
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkButton: { marginTop: 10, alignItems: 'center' },
  linkText: { fontSize: 14 },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { fontSize: 14 },
});
