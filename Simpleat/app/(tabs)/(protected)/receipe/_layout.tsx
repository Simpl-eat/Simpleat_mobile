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
      }}>
      {/**
       * Une seule entrée de pile pour toutes les fiches : changer d’id met à jour les params
       * sur le même écran au lieu d’empiler des copies qui gardent l’ancien état React.
       */}
      <Stack.Screen
        name="[id]"
        dangerouslySingular={() => 'recipe-detail'}
      />
    </Stack>
  );
}
