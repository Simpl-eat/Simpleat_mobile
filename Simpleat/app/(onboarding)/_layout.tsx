import { Stack } from 'expo-router';

import { OnboardingWizardProvider } from '@/contexts/onboarding-wizard-context';

export default function OnboardingLayout() {
  return (
    <OnboardingWizardProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackTitle: 'Retour',
        }}>
        <Stack.Screen
          name="step-1"
          options={{ title: 'Bienvenue' }}
        />
        <Stack.Screen name="step-2" options={{ title: 'Ton pseudo' }} />
        <Stack.Screen
          name="step-3"
          options={{ title: 'Préférences' }}
        />
        <Stack.Screen name="summary" options={{ title: 'Récapitulatif' }} />
      </Stack>
    </OnboardingWizardProvider>
  );
}
