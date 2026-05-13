import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingWizard } from '@/contexts/onboarding-wizard-context';
import { DIET_GOAL_LABELS } from '@/lib/diet-goal-labels';
import { supabase } from '@/lib/supabase';

function SelectionGroup({ label, options, selected, onSelect }: { label: string; options: string[]; selected: string; onSelect: (v: string) => void; }) {
  return (
      <View style={styles.group}>
        <Text style={styles.groupLabel}>{label}</Text>
        <View style={styles.chipRow}>
          {options.map((opt) => {
            const isSelected = selected === opt;
            return (
                <TouchableOpacity key={opt} onPress={() => onSelect(opt)} style={[styles.chip, isSelected && styles.chipSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" style={styles.chipIcon} />}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {DIET_GOAL_LABELS[opt] ?? opt}
                  </Text>
                </TouchableOpacity>
            );
          })}
        </View>
      </View>
  );
}

export default function OnboardingStep3Screen() {
  const router = useRouter();
  const { data, setData } = useOnboardingWizard();
  const [diets, setDiets] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [diet, setDiet] = useState(data.diet);
  const [goal, setGoal] = useState(data.goal);

  useEffect(() => {
    async function load() {
      const { data: dietData } = await supabase.rpc('get_diet_options');
      const { data: goalData } = await supabase.rpc('get_goal_options');

      let nextDiets: string[] = [];
      if (dietData?.length) {
        const filtered = (dietData as string[]).filter((i) => i !== 'None');
        nextDiets = ['None', ...filtered];
      }
      setDiets(nextDiets);
      setGoals((goalData as string[]) ?? []);
      setDiet((d) => d && nextDiets.includes(d) ? d : (nextDiets[0] ?? 'None'));
      setGoal((g) => g && (goalData as string[]).includes(g) ? g : ((goalData as string[])[0] ?? ''));
      setLoading(false);
    }
    void load();
  }, []);

  function onNext() {
    setData({ diet, goal });
    router.push('/summary');
  }

  if (loading || !diets.length || !goals.length) {
    return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#496943" />
          <Text style={styles.loaderText}>Chargement de tes options...</Text>
        </View>
    );
  }

  return (
      <View style={styles.screen}>
        <ImageBackground source={require('../../assets/images/fond_picto_all.png')} style={styles.backgroundImage} imageStyle={{ opacity: 0.08 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <View style={styles.iconHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="restaurant-outline" size={28} color="#496943" />
                </View>
              </View>

              <Text style={styles.title}>Quelles sont tes habitudes ?</Text>
              <Text style={styles.descriptionText}>L'IA a besoin de ces informations pour générer des recettes parfaites pour toi.</Text>

              <View style={styles.selectionsContainer}>
                <SelectionGroup label="Régime alimentaire" options={diets} selected={diet} onSelect={setDiet} />
                <View style={styles.divider} />
                <SelectionGroup label="Objectif principal" options={goals} selected={goal} onSelect={setGoal} />
              </View>

              <TouchableOpacity style={styles.btnMain} onPress={onNext}>
                <Text style={styles.btnMainText}>Continuer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ImageBackground>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EA' },
  backgroundImage: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F3EA' },
  loaderText: { color: '#6B7280', marginTop: 16, fontSize: 16, fontWeight: '500' },

  card: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, shadowColor: '#496943', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  iconHeader: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F7F3EA', alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 24, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  descriptionText: { fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 30 },

  selectionsContainer: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 24, marginBottom: 30 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },

  group: { gap: 12 },
  groupLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  chipSelected: { backgroundColor: '#496943', borderColor: '#496943' },
  chipIcon: { marginRight: 6 },
  chipText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  chipTextSelected: { color: '#FFFFFF' },

  btnMain: { backgroundColor: '#496943', paddingVertical: 18, borderRadius: 22, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  btnMainText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});