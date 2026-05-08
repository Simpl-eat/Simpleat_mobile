import { createContext, useContext } from 'react';

import {
  useAuthRouting,
  type AuthRoutingState,
} from '@/hooks/use-auth-routing';

const AuthRoutingContext = createContext<AuthRoutingState | null>(null);

export function AuthRoutingProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthRouting();
  return (
    <AuthRoutingContext.Provider value={value}>
      {children}
    </AuthRoutingContext.Provider>
  );
}

export function useAuthRoutingContext(): AuthRoutingState {
  const ctx = useContext(AuthRoutingContext);
  if (!ctx) {
    throw new Error('useAuthRoutingContext doit être utilisé dans AuthRoutingProvider');
  }
  return ctx;
}
