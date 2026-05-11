import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfilScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mon profil</ThemedText>
      <ThemedText style={styles.subtitle}>Tes informations et préférences seront affichées ici.</ThemedText>
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
