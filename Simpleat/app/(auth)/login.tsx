import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#111',
    muted: isDark ? '#A1A1AA' : '#666',
    border: isDark ? '#2A2A2A' : '#ddd',
    inputBg: isDark ? '#0B0B0B' : '#fff',
    primary: '#4CAF50',
    infoBg: isDark ? '#14532d' : '#e8f5e9',
    infoText: isDark ? '#bbf7d0' : '#1b5e20',
  };

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

      router.replace('/home');
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
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>Connexion</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Connecte-toi à ton compte Simpl&apos;eat
          </Text>

          {infoMessage ? (
            <View style={[styles.infoBox, { backgroundColor: colors.infoBg }]}>
              <Text style={[styles.infoText, { color: colors.infoText }]}>
                {infoMessage}
              </Text>
            </View>
          ) : null}

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
              placeholder="ex: toi@email.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
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
              Mot de passe
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Ton mot de passe"
              placeholderTextColor={colors.muted}
              secureTextEntry
              textContentType="password"
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

          <TouchableOpacity
            onPress={handleLogin}
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
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/register')}
            disabled={loading}
            style={styles.linkButton}
          >
            <Text style={[styles.linkText, { color: colors.muted }]}>
              Pas de compte ?{' '}
              <Text style={[styles.linkTextStrong, { color: colors.text }]}>
                Créer un compte
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 6,
  },
  infoBox: {
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  linkTextStrong: {
    fontWeight: '700',
  },
});
