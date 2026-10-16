import { Stack } from 'expo-router';
import { OnboardingWizardProvider } from '@/contexts/onboarding-wizard-context';

export default function OnboardingLayout() {
    return (
        <OnboardingWizardProvider>
            <Stack
                screenOptions={{
                    headerShown: true,
                    headerStyle: { backgroundColor: '#F7F3EA' },
                    headerTintColor: '#496943',
                    headerShadowVisible: false,
                    headerBackButtonDisplayMode: 'minimal',
                    contentStyle: { backgroundColor: '#F7F3EA' }
                }}>
                <Stack.Screen name="step-1" options={{ title: 'Étape 1/4' }} />
                <Stack.Screen name="step-2" options={{ title: 'Étape 2/4' }} />
                <Stack.Screen name="step-3" options={{ title: 'Étape 3/4' }} />
                <Stack.Screen name="summary" options={{ title: 'Étape 4/4' }} />
            </Stack>
        </OnboardingWizardProvider>
    );
}