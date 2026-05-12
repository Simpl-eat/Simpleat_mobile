import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { getProfileByUserId } from '@/lib/profile';
import { DIET_GOAL_LABELS } from '@/lib/diet-goal-labels';
import type { Profile } from '@/lib/types/profile';

type AuthMetadata = {
  age?: number | string;
  gender?: string;
  height?: number | string;
  weight?: number | string;
};

export type UpdateProfilePayload = {
  pseudo: string;
  diet: string;
  goal: string;
  allergy: string | null;
  desire: string | null;
};

export type UpdatePasswordPayload = {
  password: string;
};

export type ChangePasswordPayload = {
  password: string;
  confirmPassword: string;
};

export type ChangeEmailPayload = {
  email: string;
  confirmEmail: string;
};

export type UpdateEmailPayload = {
  email: string;
};

function splitTags(raw?: string | null) {
  return raw
    ? raw
        .split(/[,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export type UseProfileResult = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveError: string | null;
  passwordSaving: boolean;
  passwordError: string | null;
  passwordMessage: string | null;
  emailSaving: boolean;
  emailError: string | null;
  emailMessage: string | null;
  signOutLoading: boolean;
  signOutError: string | null;
  displayName: string;
  subtitle: string | null;
  dietLabel: string;
  goalLabel: string;
  preferredItems: string[];
  allergyItems: string[];
  age: string | null;
  gender: string | null;
  height: string | null;
  weight: string | null;
  refresh: () => Promise<void>;
  saveProfile: (payload: UpdateProfilePayload) => Promise<boolean>;
  changePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
  changeEmail: (payload: ChangeEmailPayload) => Promise<boolean>;
  signOut: () => Promise<boolean>;
};

export function useProfile(): UseProfileResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);


  const loadProfile = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    const { profile: fetchedProfile, error: fetchError } =
      await getProfileByUserId(userId);

    if (fetchError) {
      setError(fetchError.message);
      setProfile(null);
    } else {
      setProfile(fetchedProfile);
    }

    setIsLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  const saveProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!user?.id) {
        setSaveError('Utilisateur non connecté.');
        return false;
      }

      setIsSaving(true);
      setSaveError(null);

      const { data, error: updateError } = await supabase
        .from('profile')
        .update({
          pseudo: payload.pseudo.trim(),
          diet: payload.diet,
          goal: payload.goal,
          allergy: payload.allergy?.trim() || null,
          desire: payload.desire?.trim() || null,
        })
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (updateError) {
        setSaveError(updateError.message);
        setIsSaving(false);
        return false;
      }

      setProfile(data as Profile | null);
      setIsSaving(false);
      return true;
    },
    [user?.id],
  );

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      setPasswordSaving(true);
      setPasswordError(null);
      setPasswordMessage(null);

      if (!payload.password) {
        setPasswordError('Veuillez saisir un nouveau mot de passe.');
        setPasswordSaving(false);
        return false;
      }

      if (payload.password.length < 6) {
        setPasswordError('Le mot de passe doit contenir au moins 6 caractères.');
        setPasswordSaving(false);
        return false;
      }

      if (payload.password !== payload.confirmPassword) {
        setPasswordError('La confirmation ne correspond pas.');
        setPasswordSaving(false);
        return false;
      }

      const { error: authError } = await supabase.auth.updateUser({
        password: payload.password,
      });

      setPasswordSaving(false);

      if (authError) {
        setPasswordError(authError.message);
        return false;
      }

      setPasswordMessage('Mot de passe mis à jour avec succès.');
      return true;
    },
    [],
  );

  const changeEmail = useCallback(
    async (payload: ChangeEmailPayload) => {
      setEmailSaving(true);
      setEmailError(null);
      setEmailMessage(null);

      if (!payload.email) {
        setEmailError('Veuillez saisir un nouvel email.');
        setEmailSaving(false);
        return false;
      }

        if (payload.email !== payload.confirmEmail) {
        setEmailError('La confirmation ne correspond pas.');
        setEmailSaving(false);
        return false;
      }

      if (!payload.email.includes('@')) {
        setEmailError('Veuillez saisir une adresse email valide qui contient un @.');
        setEmailSaving(false);
        return false;
      }

      const { error: authError } = await supabase.auth.updateUser({
        email: payload.email,
      });

      if (authError) {
        setEmailError(authError.message);
        setEmailSaving(false);
        return false;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        setUser(sessionData.session.user);
      }

      setEmailSaving(false);
      setEmailMessage('Adresse email mise à jour avec succès.');
      return true;
    },
    [],
  );

  const signOut = useCallback(async () => {
    setSignOutLoading(true);
    setSignOutError(null);

    const { error } = await supabase.auth.signOut();

    setSignOutLoading(false);

    if (error) {
      setSignOutError(error.message);
      return false;
    }

    return true;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setUser(nextSession?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void loadProfile(user.id);
  }, [user?.id, loadProfile]);

  const metadata = useMemo<AuthMetadata>(() => {
    return (user?.user_metadata as AuthMetadata) ?? {};
  }, [user?.user_metadata]);

  const preferredItems = useMemo(
    () => splitTags(profile?.desire),
    [profile?.desire],
  );

  const allergyItems = useMemo(
    () => splitTags(profile?.allergy),
    [profile?.allergy],
  );

  const dietLabel = useMemo(
    () => DIET_GOAL_LABELS[profile?.diet ?? ''] ?? profile?.diet ?? 'Aucun',
    [profile?.diet],
  );

  const goalLabel = useMemo(
    () => DIET_GOAL_LABELS[profile?.goal ?? ''] ?? profile?.goal ?? 'Aucun',
    [profile?.goal],
  );

  const displayName = useMemo(() => {
    if (profile?.pseudo) return profile.pseudo;
    if (user?.email) return user.email.split('@')[0];
    return 'Mon profil';
  }, [profile?.pseudo, user?.email]);

  const subtitle = useMemo(() => {
    return user?.email ?? null;
  }, [user?.email]);

  const height = useMemo(() => {
    if (!metadata.height) return null;
    return `${metadata.height}`.trim();
  }, [metadata.height]);

  const weight = useMemo(() => {
    if (!metadata.weight) return null;
    return `${metadata.weight}`.trim();
  }, [metadata.weight]);

  return {
    user,
    profile,
    isLoading,
    isSaving,
    error,
    saveError,
    displayName,
    subtitle,
    dietLabel,
    goalLabel,
    preferredItems,
    allergyItems,
    age: metadata.age ? `${metadata.age}` : null,
    gender: metadata.gender ?? null,
    height,
    weight,
    refresh,
    saveProfile,
    passwordSaving,
    passwordError,
    passwordMessage,
    emailSaving,
    emailError,
    emailMessage,
    signOutLoading,
    signOutError,
    changePassword,
    changeEmail,
    signOut,
  };
}