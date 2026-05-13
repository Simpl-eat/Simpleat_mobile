import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthRedirect } from '@/components/auth-redirect';
import { AuthRoutingProvider } from '@/contexts/auth-routing-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: '#F7F3EA',
      border: 'transparent',
    },
  };

  return (
      <ThemeProvider value={theme}>
        <AuthRoutingProvider>
          <AuthRedirect>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                  name="(onboarding)"
                  options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                  name="modal"
                  options={{ presentation: 'modal', title: 'Modal' }}
              />
              <Stack.Screen name="scan" options={{ headerShown: false, presentation: 'modal' }} />
            </Stack>
          </AuthRedirect>
        </AuthRoutingProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
  );
}