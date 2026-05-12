import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useProfile } from '@/hooks/useProfile';

type ProfileFormState = {
  pseudo: string;
  diet: string;
  goal: string;
  allergy: string;
  desire: string;
};

function Pill({
  label,
  variant,
}: {
  label: string;
  variant: 'diet' | 'like' | 'allergy';
}) {
  const backgroundColor =
    variant === 'diet'
      ? '#F6D55D'
      : variant === 'like'
      ? '#7AA2B4'
      : '#EB6C6C';

  const textColor = variant === 'diet' ? '#2F2F1D' : '#fff';

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <ThemedText style={[styles.pillText, { color: textColor }]}>
        {label}
      </ThemedText>
    </View>
  );
}

export default function ProfilScreen() {
  const {
    profile,
    isLoading,
    isSaving,
    error,
    saveError,
    passwordSaving,
    passwordError,
    passwordMessage,
    emailSaving,
    emailError,
    emailMessage,
    signOutLoading,
    signOutError,
    displayName,
    subtitle,
    dietLabel,
    preferredItems,
    allergyItems,
    saveProfile,
    changePassword,
    changeEmail,
    signOut,
  } = useProfile();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({
    pseudo: '',
    diet: '',
    goal: '',
    allergy: '',
    desire: '',
  });
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      pseudo: profile?.pseudo ?? '',
      diet: profile?.diet ?? '',
      goal: profile?.goal ?? '',
      allergy: profile?.allergy ?? '',
      desire: profile?.desire ?? '',
    });
  }, [profile]);

  function setField(key: keyof ProfileFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (!profile) {
      setLocalError('Aucun profil disponible pour la mise à jour.');
      return;
    }

    const success = await saveProfile({
      pseudo: form.pseudo,
      diet: form.diet,
      goal: form.goal,
      allergy: form.allergy || null,
      desire: form.desire || null,
    });

    if (success) {
      setEditing(false);
      setLocalError(null);
    }
  }

  async function handleChangePassword() {
    const success = await changePassword({
      password,
      confirmPassword: passwordConfirm,
    });

    if (success) {
      setPassword('');
      setPasswordConfirm('');
    }
  }

  async function handleChangeEmail() {
    const success = await changeEmail({
      email,
      confirmEmail: emailConfirm,
    });

    if (success) {
      setEmail('');
      setEmailConfirm('');
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.pageTitle}>
            Mon profil
          </ThemedText>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarText}>
              {displayName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0].toUpperCase())
                .join('') || 'A'}
            </ThemedText>
          </View>

          <View style={styles.profileInfo}>
            <ThemedText type="subtitle" style={styles.profileName}>
              {displayName}
            </ThemedText>
          </View>
        </View>

        {signOutError ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{signOutError}</ThemedText>
          </View>
        ) : null}

        <Pressable
          style={[styles.signOutButton, signOutLoading && styles.saveButtonDisabled]}
          onPress={handleSignOut}
          disabled={signOutLoading}
        >
          {signOutLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Déconnexion</ThemedText>
          )}
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Mon régime alimentaire
          </ThemedText>
          <View style={styles.pillRow}>
            <Pill label={dietLabel} variant="diet" />
            {preferredItems.map((item) => (
              <Pill key={`like-${item}`} label={item} variant="like" />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Mes allergies
          </ThemedText>
          {allergyItems.length > 0 ? (
            <View style={styles.pillRow}>
              {allergyItems.map((item) => (
                <Pill key={`allergy-${item}`} label={item} variant="allergy" />
              ))}
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>
              Aucune allergie renseignée.
            </ThemedText>
          )}
        </View>

        <Pressable
          style={styles.editToggle}
          onPress={() => setEditing((current) => !current)}
        >
          <ThemedText style={styles.editToggleText}>
            Modifier mes informations
          </ThemedText>
          <ThemedText style={styles.editToggleIcon}>
            {editing ? '▲' : '▼'}
          </ThemedText>
        </Pressable>

        {editing ? (
          <View style={styles.editPanel}>
            <View style={styles.inputBlock}>
              <ThemedText style={styles.inputLabel}>Pseudo</ThemedText>
              <TextInput
                value={form.pseudo}
                onChangeText={(value) => setField('pseudo', value)}
                placeholder="Pseudo"
                style={styles.input}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputBlock}>
              <ThemedText style={styles.inputLabel}>Régime</ThemedText>
              <TextInput
                value={form.diet}
                onChangeText={(value) => setField('diet', value)}
                placeholder="Vegetarian, Vegan, None…"
                style={styles.input}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputBlock}>
              <ThemedText style={styles.inputLabel}>Objectif</ThemedText>
              <TextInput
                value={form.goal}
                onChangeText={(value) => setField('goal', value)}
                placeholder="Weight loss, Weight gain…"
                style={styles.input}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputBlock}>
              <ThemedText style={styles.inputLabel}>Allergies</ThemedText>
              <TextInput
                value={form.allergy}
                onChangeText={(value) => setField('allergy', value)}
                placeholder="Arachides, Gluten…"
                style={styles.input}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputBlock}>
              <ThemedText style={styles.inputLabel}>Envies</ThemedText>
              <TextInput
                value={form.desire}
                onChangeText={(value) => setField('desire', value)}
                placeholder="Gagner de la masse musculaire…"
                style={[styles.input, styles.multilineInput]}
                editable={!isSaving}
                multiline
              />
            </View>

            <View style={styles.passwordSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Modifier mon email
              </ThemedText>

              <View style={styles.inputBlock}>
                <ThemedText style={styles.inputLabel}>Nouvel email</ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nouvel@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  editable={!emailSaving}
                />
              </View>

              <View style={styles.inputBlock}>
                <ThemedText style={styles.inputLabel}>Confirmer votre email</ThemedText>
                <TextInput
                  value={emailConfirm}
                  onChangeText={setEmailConfirm}
                  placeholder="Confirmer l'email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  editable={!emailSaving}
                />
              </View>

              {(emailError || emailMessage) && (
                <View style={[styles.errorBox, !emailError && styles.successBox]}>
                  <ThemedText style={[styles.errorText, !emailError && styles.successText]}>
                    {emailError ?? emailMessage}
                  </ThemedText>
                </View>
              )}

              <Pressable
                style={[
                  styles.saveButton,
                  emailSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleChangeEmail}
                disabled={emailSaving}
              >
                {emailSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>
                    Mettre à jour mon email
                  </ThemedText>
                )}
              </Pressable>
            </View>

            <View style={styles.passwordSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Modifier mon mot de passe
              </ThemedText>

              <View style={styles.inputBlock}>
                <ThemedText style={styles.inputLabel}>Nouveau mot de passe</ThemedText>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  style={styles.input}
                  editable={!passwordSaving}
                />
              </View>

              <View style={styles.inputBlock}>
                <ThemedText style={styles.inputLabel}>Confirmer le mot de passe</ThemedText>
                <TextInput
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  placeholder="••••••••"
                  secureTextEntry
                  style={styles.input}
                  editable={!passwordSaving}
                />
              </View>

              {(passwordError || passwordMessage) && (
                <View style={[styles.errorBox, !passwordError && styles.successBox]}>
                  <ThemedText style={[styles.errorText, !passwordError && styles.successText]}>
                    {passwordError ?? passwordMessage}
                  </ThemedText>
                </View>
              )}

              <Pressable
                style={[
                  styles.saveButton,
                  passwordSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={passwordSaving}
              >
                {passwordSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>
                    Mettre à jour le mot de passe
                  </ThemedText>
                )}
              </Pressable>
            </View>

            {(error || saveError || localError) && (
              <View style={styles.errorBox}>
                <ThemedText style={styles.errorText}>
                  {error ?? saveError ?? localError}
                </ThemedText>
              </View>
            )}

            <Pressable
              style={[
                styles.saveButton,
                (isLoading || isSaving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Sauvegarder</ThemedText>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  container: {
    padding: 24,
    gap: 20,
  },
  header: {
    paddingTop: 8,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#3F533B',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EAEDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4B5A31',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#40502F',
  },
  profileSubtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#5B6A51',
  },
  divider: {
    height: 1,
    backgroundColor: '#D9E2D1',
    marginVertical: 16,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#40502F',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: '#5B6A51',
    fontSize: 15,
  },
  metricPill: {
    backgroundColor: '#F4C949',
  },
  metricPillGreen: {
    backgroundColor: '#40502F',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F2F1D',
  },
  metricLabelWhite: {
    color: '#FFFFFF',
  },
  editToggle: {
    backgroundColor: '#F4F4F3',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editToggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3F533B',
  },
  editToggleIcon: {
    fontSize: 16,
    color: '#3F533B',
  },
  editPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  inputBlock: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#5B6A51',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E3E7DE',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1F2A18',
    backgroundColor: '#F8F8F4',
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  passwordSection: {
    gap: 12,
  },
  successBox: {
    backgroundColor: '#E6F8EF',
  },
  successText: {
    color: '#1E5F39',
  },
  saveButton: {
    backgroundColor: '#40502F',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#A12A2A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#FDECEA',
    borderRadius: 16,
    padding: 12,
  },
  errorText: {
    color: '#A12A2A',
    fontSize: 14,
  },
});