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
  View,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthRoutingContext } from '@/contexts/auth-routing-context';
import { useOnboardingWizard } from '@/contexts/onboarding-wizard-context';
import { DIET_GOAL_LABELS } from '@/lib/diet-goal-labels';
import { createProfileFromOnboarding } from '@/lib/profile';

export default function OnboardingSummaryScreen() {
  const router = useRouter();
  const { data, reset } = useOnboardingWizard();
  const { session, refreshProfile } = useAuthRoutingContext();

  const [allergy, setAllergy] = useState(data.allergy);
  const [desire, setDesire] = useState(data.desire);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    router.replace('/suggestions');
    setSubmitting(false);
  }

  return (
      <View style={styles.screen}>
        <ImageBackground source={require('../../assets/images/fond_picto_all.png')} style={styles.backgroundImage} imageStyle={{ opacity: 0.08 }}>
          <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

              <View style={styles.card}>
                <View style={styles.iconHeader}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="checkmark-circle-outline" size={32} color="#496943" />
                  </View>
                </View>

                <Text style={styles.title}>Dernière étape !</Text>

                <View style={styles.summaryBox}>
                  <Text style={styles.sectionTitle}>Ton profil :</Text>

                  <View style={styles.summaryRow}>
                    <Ionicons name="person" size={18} color="#9CA3AF" />
                    <Text style={styles.summaryLabel}>Pseudo :</Text>
                    <Text style={styles.summaryValue}>{data.pseudo || '—'}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Ionicons name="restaurant" size={18} color="#9CA3AF" />
                    <Text style={styles.summaryLabel}>Régime :</Text>
                    <Text style={styles.summaryValue}>{DIET_GOAL_LABELS[data.diet] ?? data.diet}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Ionicons name="flag" size={18} color="#9CA3AF" />
                    <Text style={styles.summaryLabel}>Objectif :</Text>
                    <Text style={styles.summaryValue}>{DIET_GOAL_LABELS[data.goal] ?? data.goal}</Text>
                  </View>
                </View>

                <View style={styles.optionalSection}>
                  <View style={styles.optionalHeader}>
                    <Text style={styles.sectionTitle}>Allergies & Envies</Text>
                    <View style={styles.optionalBadge}><Text style={styles.optionalBadgeText}>Optionnel</Text></View>
                  </View>
                  <Text style={styles.hint}>Précise tes contraintes ou envies du moment.</Text>

                  <View style={styles.inputContainer}>
                    <Ionicons name="warning-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                        value={allergy}
                        onChangeText={setAllergy}
                        placeholder="Ex: Arachides, Gluten..."
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="bulb-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                        value={desire}
                        onChangeText={setDesire}
                        placeholder="Ex: Gagner de la masse..."
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />
                  </View>
                </View>

                {error && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={20} color="#E55353" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity style={[styles.btnMain, submitting && styles.btnDisabled]} onPress={onFinish} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnMainText}>Finaliser mon inscription</Text>}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EA' },
  backgroundImage: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },

  card: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, shadowColor: '#496943', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  iconHeader: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E5F0E1', alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 24, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 24 },

  summaryBox: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 20, marginBottom: 24, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryLabel: { fontSize: 15, color: '#6B7280' },
  summaryValue: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1F2937', textAlign: 'right' },

  optionalSection: { marginBottom: 30 },
  optionalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  optionalBadge: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  optionalBadgeText: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  hint: { fontSize: 14, color: '#6B7280', marginBottom: 16 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1F2937', height: '100%' },

  errorBox: { flexDirection: 'row', backgroundColor: '#FFF0F0', padding: 14, borderRadius: 16, gap: 10, alignItems: 'center', marginBottom: 20 },
  errorText: { flex: 1, color: '#E55353', fontSize: 14, fontWeight: '500' },

  btnMain: { backgroundColor: '#496943', paddingVertical: 18, borderRadius: 22, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  btnDisabled: { backgroundColor: '#A8C699', shadowOpacity: 0, elevation: 0 },
  btnMainText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});