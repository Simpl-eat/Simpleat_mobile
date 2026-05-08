import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { useOnboardingWizard } from '@/contexts/onboarding-wizard-context';
import { DIET_GOAL_LABELS } from '@/lib/diet-goal-labels';
import { supabase } from '@/lib/supabase';

function SelectionGroup({
  label,
  options,
  selected,
  onSelect,
  colors,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  colors: {
    text: string;
    border: string;
    primary: string;
  };
}) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={[
              styles.chip,
              { borderColor: colors.border },
              selected === opt && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: selected === opt ? '#fff' : colors.text },
              ]}
            >
              {DIET_GOAL_LABELS[opt] ?? opt}
            </Text>
          </TouchableOpacity>
        ))}
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

  const isDark = useColorScheme() === 'dark';
  const colors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#111',
    muted: isDark ? '#A1A1AA' : '#666',
    border: isDark ? '#2A2A2A' : '#ddd',
    primary: '#4CAF50',
  };

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

      let nextGoals: string[] = (goalData as string[]) ?? [];
      setGoals(nextGoals);

      setDiet((d) =>
        d && nextDiets.includes(d) ? d : (nextDiets[0] ?? 'None'),
      );
      setGoal((g) =>
        g && nextGoals.includes(g) ? g : (nextGoals[0] ?? ''),
      );

      setLoading(false);
    }
    void load();
  }, []);

  function onNext() {
    setData({ diet, goal });
    router.push('/summary');
  }

  const selectionColors = {
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  };

  if (loading || !diets.length || !goals.length) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: colors.muted, marginTop: 12 }}>
          Chargement des options…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <SelectionGroup
        label="Régime alimentaire"
        options={diets}
        selected={diet}
        onSelect={setDiet}
        colors={selectionColors}
      />
      <SelectionGroup
        label="Objectif"
        options={goals}
        selected={goal}
        onSelect={setGoal}
        colors={selectionColors}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  group: {
    gap: 10,
  },
  groupLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
});
