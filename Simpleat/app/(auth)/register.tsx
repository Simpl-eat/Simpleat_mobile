import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [objective, setObjective] = useState('');

  async function handleSignUp() {
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          age: parseInt(age),
          objective: objective,
        },
      },
    });

    if (error) {
      Alert.alert("Erreur", error.message);
    } else {
      Alert.alert("Succès", "Compte créé ! Vérifie tes emails.");
      router.replace('/(tabs)');
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créer un compte Simpl’eat</Text>

      <TextInput placeholder="Prénom" onChangeText={setFirstName} style={styles.input} />
      <TextInput placeholder="Nom" onChangeText={setLastName} style={styles.input} />
      <TextInput placeholder="Âge" keyboardType="numeric" onChangeText={setAge} style={styles.input} />
      <TextInput placeholder="Objectif (ex: Perdre du poids)" onChangeText={setObjective} style={styles.input} />
      
      <View style={styles.divider} />

      <TextInput placeholder="Email" autoCapitalize="none" onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Mot de passe" secureTextEntry onChangeText={setPassword} style={styles.input} />
      <TextInput placeholder="Confirmer le mot de passe" secureTextEntry onChangeText={setConfirmPassword} style={styles.input} />

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Création..." : "Créer mon compte"}</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.linkText}>Déjà un compte ? Connecte-toi</Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  button: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  linkText: { marginTop: 15, color: '#666', textAlign: 'center' }
});