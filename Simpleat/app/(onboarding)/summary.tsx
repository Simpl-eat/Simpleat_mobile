import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { useAuthRoutingContext } from '@/contexts/auth-routing-context';
import { useOnboardingWizard } from '@/contexts/onboarding-wizard-context';
import { DIET_GOAL_LABELS } from '@/lib/diet-goal-labels';
import { createProfileFromOnboarding } from '@/lib/profile';

export default function OnboardingSummaryScreen() {
  const router = useRouter();
  const { data, setData, reset } = useOnboardingWizard();
  const { session, refreshProfile } = useAuthRoutingContext();

  const [allergy, setAllergy] = useState(data.allergy);
  const [desire, setDesire] = useState(data.desire);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = useColorScheme() === 'dark';
  const colors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#111',
    muted: isDark ? '#A1A1AA' : '#666',
    border: isDark ? '#2A2A2A' : '#ddd',
    inputBg: isDark ? '#0B0B0B' : '#fff',
    primary: '#4CAF50',
  };

  async function onFinish() {
    const userId = session?.user?.id;
    if (!userId) {
      setError('Session introuvable. Reconnecte-toi.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await createProfileFromOnboarding({
      userId,
      pseudo: data.pseudo,
      diet: data.diet,
      goal: data.goal,
      allergy: allergy.trim() || null,
      desire: desire.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    reset();
    await refreshProfile();
    router.replace('/home');
    setSubmitting(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Récapitulatif
        </Text>
        <Text style={[styles.line, { color: colors.muted }]}>
          Pseudo :{' '}
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {data.pseudo || '—'}
          </Text>
        </Text>
        <Text style={[styles.line, { color: colors.muted }]}>
          Régime :{' '}
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {DIET_GOAL_LABELS[data.diet] ?? data.diet}
          </Text>
        </Text>
        <Text style={[styles.line, { color: colors.muted }]}>
          Objectif :{' '}
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {DIET_GOAL_LABELS[data.goal] ?? data.goal}
          </Text>
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
          Optionnel
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Allergies ou envies particulières (tu peux laisser vide).
        </Text>

        <TextInput
          value={allergy}
          onChangeText={setAllergy}
          placeholder="Allergies"
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
        <TextInput
          value={desire}
          onChangeText={setDesire}
          placeholder="Envies / notes"
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

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            submitting && styles.buttonDisabled,
          ]}
          onPress={onFinish}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Terminer et accéder à l&apos;app</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    gap: 12,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  line: {
    fontSize: 15,
    lineHeight: 22,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    color: '#c62828',
    fontSize: 14,
  },
  button: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
});
