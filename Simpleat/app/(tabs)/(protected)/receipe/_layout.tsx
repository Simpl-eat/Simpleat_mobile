import { Stack } from 'expo-router';

/**
 * Layout du segment receipe : Stack sans header par défaut.
 * Liste des suggestions : écran `suggestions` (onglet). Ce stack ne contient que la fiche `[id]`.
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
