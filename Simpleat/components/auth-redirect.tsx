import { usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import { useAuthRoutingContext } from '@/contexts/auth-routing-context';

void SplashScreen.preventAutoHideAsync();

const ONBOARDING_PATHS = new Set(['/step-1', '/step-2', '/step-3', '/summary']);

/** Routes accessibles sans être connecté (hors onboarding). */
function isWelcomeOrAuth(pathname: string): boolean {
  return pathname === '/' || pathname === '/login' || pathname === '/register';
}

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const { session, initialized, hasProfile, profileLoading } =
    useAuthRoutingContext();
  const hiddenSplash = useRef(false);

  useEffect(() => {
    if (!initialized) return;
    if (!hiddenSplash.current) {
      hiddenSplash.current = true;
      void SplashScreen.hideAsync();
    }
  }, [initialized]);

  useEffect(() => {
    if (!initialized) return;

    const waitingProfile = Boolean(session?.user && hasProfile === null && profileLoading);
    if (waitingProfile) return;

    if (!session) {
      if (ONBOARDING_PATHS.has(pathname)) {
        router.replace('/');
        return;
      }
      if (!isWelcomeOrAuth(pathname)) {
        router.replace('/');
      }
      return;
    }

    if (hasProfile === false) {
      if (!ONBOARDING_PATHS.has(pathname)) {
        router.replace('/step-1');
      }
      return;
    }

    if (hasProfile === true) {
      if (isWelcomeOrAuth(pathname) || ONBOARDING_PATHS.has(pathname)) {
        router.replace('/suggestions');
      }
    }
  }, [
    initialized,
    session,
    hasProfile,
    profileLoading,
    pathname,
    router,
  ]);

  const showBootOverlay =
    !initialized ||
    Boolean(session?.user && hasProfile === null && profileLoading);

  const overlayBackground =
    colorScheme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)';

  return (
    <>
      {children}
      {showBootOverlay ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.overlay,
            { backgroundColor: overlayBackground },
          ]}
        >
          <ActivityIndicator size="large" />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});