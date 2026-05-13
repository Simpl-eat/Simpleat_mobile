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
  View,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      const { data: isAvailable, error } = await supabase.rpc('is_pseudo_available', { p_pseudo: trimmed });
      if (requestIdRef.current !== currentRequestId) return;
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
      <View style={styles.screen}>
        <ImageBackground source={require('../../assets/images/fond_picto_all.png')} style={styles.backgroundImage} imageStyle={{ opacity: 0.08 }}>
          <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.card}>
              <View style={styles.iconHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={28} color="#496943" />
                </View>
              </View>

              <Text style={styles.title}>Comment doit-on t'appeler ?</Text>
              <Text style={styles.descriptionText}>Choisis un pseudo unique pour ton profil Simpl'eat.</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="at" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                    value={pseudo}
                    onChangeText={setPseudo}
                    placeholder="Ton pseudo"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    style={styles.input}
                />
              </View>

              <View style={styles.statusRow}>
                {checkStatus === 'checking' && <ActivityIndicator size="small" color="#496943" />}
                {checkStatus === 'available' && <Ionicons name="checkmark-circle" size={18} color="#496943" />}
                {(checkStatus === 'taken' || checkStatus === 'error') && <Ionicons name="close-circle" size={18} color="#E55353" />}
                {checkStatus === 'idle' && <Ionicons name="information-circle" size={18} color="#9CA3AF" />}

                <Text style={[styles.statusText,
                  checkStatus === 'available' ? { color: '#496943' } :
                      checkStatus === 'taken' || checkStatus === 'error' ? { color: '#E55353' } :
                          { color: '#6B7280' }
                ]}>
                  {checkMessage || "Saisis un pseudo de plus de 3 caractères."}
                </Text>
              </View>

              <TouchableOpacity style={[styles.btnMain, !canNext && styles.btnDisabled]} disabled={!canNext} onPress={onNext}>
                <Text style={styles.btnMainText}>Continuer</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EA' },
  backgroundImage: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  card: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, shadowColor: '#496943', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  iconHeader: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F7F3EA', alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 24, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  descriptionText: { fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 30 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1F2937', height: '100%' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 30, paddingHorizontal: 4 },
  statusText: { fontSize: 13, fontWeight: '500' },

  btnMain: { backgroundColor: '#496943', paddingVertical: 18, borderRadius: 22, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  btnDisabled: { backgroundColor: '#A8C699', shadowOpacity: 0, elevation: 0 },
  btnMainText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});