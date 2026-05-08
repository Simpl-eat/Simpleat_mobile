import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { useOnboardingWizard } from '@/contexts/onboarding-wizard-context';
import { supabase } from '@/lib/supabase';

type PseudoCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export default function OnboardingStep2Screen() {
  const router = useRouter();
  const { data, setData } = useOnboardingWizard();
  const [pseudo, setPseudo] = useState(data.pseudo);
  const [checkStatus, setCheckStatus] = useState<PseudoCheckStatus>('idle');
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const isDark = useColorScheme() === 'dark';
  const colors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#111',
    muted: isDark ? '#A1A1AA' : '#666',
    border: isDark ? '#2A2A2A' : '#ddd',
    inputBg: isDark ? '#0B0B0B' : '#fff',
    primary: '#4CAF50',
  };

  const canNext = checkStatus === 'available';

  useEffect(() => {
    const trimmed = pseudo.trim();
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    if (trimmed.length < 3) {
      setCheckStatus('idle');
      setCheckMessage('Le pseudo doit contenir au moins 3 caractères.');
      return;
    }

    setCheckStatus('checking');
    setCheckMessage('Vérification du pseudo...');

    const timer = setTimeout(async () => {
      const { data: isAvailable, error } = await supabase.rpc('is_pseudo_available', {
        p_pseudo: trimmed,
      });
      
      if (error) {
        setCheckStatus('error');
        setCheckMessage('Impossible de vérifier le pseudo pour le moment.');
        return;
      }
      
      if (isAvailable) {
        setCheckStatus('available');
        setCheckMessage('Pseudo disponible.');
      } else {
        setCheckStatus('taken');
        setCheckMessage('Pseudo déjà utilisé.');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [pseudo]);

  function onNext() {
    setData({ pseudo: pseudo.trim() });
    router.push('/step-3');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={[styles.label, { color: colors.text }]}>
        Comment veux-tu qu&apos;on t&apos;appelle ?
      </Text>
      <TextInput
        value={pseudo}
        onChangeText={setPseudo}
        placeholder="Pseudo"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />
      {checkStatus === 'checking' ? (
        <View style={styles.checkRow}>
          <ActivityIndicator size="small" />
          <Text style={[styles.checkText, { color: colors.muted }]}>
            {checkMessage}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.checkText,
            {
              color:
                checkStatus === 'available'
                  ? '#2e7d32'
                  : checkStatus === 'taken' || checkStatus === 'error'
                    ? '#c62828'
                    : colors.muted,
            },
          ]}
        >
          {checkMessage}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          !canNext && styles.buttonDisabled,
        ]}
        disabled={!canNext}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
