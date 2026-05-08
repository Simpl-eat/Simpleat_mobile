import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types/profile';

export async function getProfileByUserId(
  userId: string,
): Promise<{ profile: Profile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error as Error };
  }
  return { profile: data as Profile | null, error: null };
}

export async function profileExistsForUser(userId: string): Promise<boolean> {
  const { profile } = await getProfileByUserId(userId);
  return profile != null;
}

export type OnboardingProfilePayload = {
  userId: string;
  pseudo: string;
  diet: string;
  goal: string;
  allergy: string | null;
  desire: string | null;
};

export async function createProfileFromOnboarding(
  payload: OnboardingProfilePayload,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('profile').insert([
    {
      user_id: payload.userId,
      pseudo: payload.pseudo.trim(),
      diet: payload.diet,
      goal: payload.goal,
      allergy: payload.allergy?.trim() || null,
      desire: payload.desire?.trim() || null,
      role: 'user',
    },
  ]);

  return { error: error ? (error as Error) : null };
}
