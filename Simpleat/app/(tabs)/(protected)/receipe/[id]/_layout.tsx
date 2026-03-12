import { Stack } from 'expo-router';

/**
 * Layout de la page détail recette : Stack avec header (retour + titre).
 * Le titre peut être mis à jour depuis index.tsx via setOptions si besoin.
 */
export default function RecipeDetailLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
