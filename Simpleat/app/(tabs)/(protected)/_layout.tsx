import { Stack } from 'expo-router';

/**
 * Layout du groupe (protected) : Stack sans header par défaut.
 * Les enfants réels sont les dossiers (ex: receipe), pas "index".
 */
export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
