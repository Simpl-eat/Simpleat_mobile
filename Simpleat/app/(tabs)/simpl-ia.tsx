import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SimplIAScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Simpl&apos;IA</ThemedText>
      <ThemedText style={styles.subtitle}>Discute avec l&apos;assistant pour des idées de recettes.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 8,
  },
  subtitle: {
    opacity: 0.75,
  },
});
