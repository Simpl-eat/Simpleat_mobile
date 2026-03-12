import { Stack } from 'expo-router';

/**
 * Layout du segment receipe : Stack sans header par défaut.
 * L’enfant réel est le dossier [id], pas "index".
 */
export default function RecipeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
