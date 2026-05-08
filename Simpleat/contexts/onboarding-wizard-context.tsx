import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type OnboardingWizardData = {
  pseudo: string;
  diet: string;
  goal: string;
  allergy: string;
  desire: string;
};

const INITIAL_DATA: OnboardingWizardData = {
  pseudo: '',
  diet: 'None',
  goal: '',
  allergy: '',
  desire: '',
};

type OnboardingWizardContextValue = {
  data: OnboardingWizardData;
  setData: (patch: Partial<OnboardingWizardData>) => void;
  reset: () => void;
};

const OnboardingWizardContext =
  createContext<OnboardingWizardContextValue | null>(null);

export function OnboardingWizardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setState] = useState<OnboardingWizardData>(INITIAL_DATA);

  const setData = useCallback((patch: Partial<OnboardingWizardData>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_DATA);
  }, []);

  const value = useMemo(
    () => ({
      data,
      setData,
      reset,
    }),
    [data, setData, reset],
  );

  return (
    <OnboardingWizardContext.Provider value={value}>
      {children}
    </OnboardingWizardContext.Provider>
  );
}

export function useOnboardingWizard(): OnboardingWizardContextValue {
  const ctx = useContext(OnboardingWizardContext);
  if (!ctx) {
    throw new Error(
      'useOnboardingWizard doit être utilisé dans OnboardingWizardProvider',
    );
  }
  return ctx;
}
