import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type FilterOption = {
  key: string;
  label: string;
};

type FilterChipsProps = {
  label: string;
  options: FilterOption[];
  selected: string | null;
  onSelect: (key: string | null) => void;
};

export function FilterChips({ label, options, selected, onSelect }: FilterChipsProps) {
  if (options.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {options.map((opt) => {
          const active = selected === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(active ? null : opt.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const ACTIVE_BG = '#4A6332';

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 2,
  },
  row: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: ACTIVE_BG,
    borderColor: ACTIVE_BG,
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
