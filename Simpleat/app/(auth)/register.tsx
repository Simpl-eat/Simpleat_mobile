import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
// Import de l'icône
import { Ionicons } from '@expo/vector-icons'; 
import { supabase } from "../../lib/supabase";

const TRANSLATIONS: Record<string, string> = {
    'None': 'Aucun',
    'Vegetarian': 'Végétarien',
    'Vegan': 'Vegan',
    'Flexitarianism': 'Flexitarien',
    'Keto': 'Cétogène',
    'Dukan': 'Dukan',
    'Mediterranean': 'Méditerranéen',
    'Carnivore': 'Carnivore',
    'Pesco-vegetarian': 'Pesco-végétarien',

    'New meal idea': 'Nouvelle idée de repas',
    'Weight gain': 'Gagner du poids',
    'Weight loss': 'Perdre du poids'
};

export default function RegisterScreen() {
    const router = useRouter();
    const isDark = useColorScheme() === "dark";
    
    const colors = {
        background: isDark ? "#000" : "#fff",
        text: isDark ? "#fff" : "#111",
        muted: isDark ? "#A1A1AA" : "#666",
        border: isDark ? "#2A2A2A" : "#ddd",
        inputBg: isDark ? "#0B0B0B" : "#fff",
        primary: "#4CAF50",
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false); // État pour l'œil

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [selectedDiet, setSelectedDiet] = useState('None');
    const [selectedGoal, setSelectedGoal] = useState('');

    const [diets, setDiets] = useState<string[]>([]);
    const [goals, setGoals] = useState<string[]>([]);

    useEffect(() => {
        async function loadOptions() {
            const { data: dietData } = await supabase.rpc('get_diet_options');
            const { data: goalData } = await supabase.rpc('get_goal_options');
            
            if (dietData) {
                const filtered = dietData.filter((i: string) => i !== 'None');
                setDiets(['None', ...filtered]);
            }
            if (goalData) {
                setGoals(goalData);
                setSelectedGoal(goalData[0]);
            }
        }
        loadOptions();
    }, []);

    const canSubmit = !loading && email.includes("@") && password.length >= 6 && pseudo.trim() !== "";

    async function handleRegister() {
        try {
            setLoading(true);
            setErrorMessage(null);

            const { data, error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) throw authError;

            if (!data.session) {
                setErrorMessage(
                    "Compte créé. Vérifie ton email puis connecte-toi pour terminer la création du profil."
                );
                router.replace("/login");
                return;
            }

            if (data.user) {
                const { error: dbError } = await supabase.from('profile').insert([{
                    user_id: data.user.id,
                    pseudo: pseudo,
                    diet: selectedDiet,
                    goal: selectedGoal,
                    role: "user"
                }]);
                if (dbError) throw dbError;
            }
            router.replace("/(tabs)");
        } catch (e: any) {
            setErrorMessage(e.message);
        } finally {
            setLoading(false);
        }
    }

    const SelectionGroup = ({ label, options, selected, onSelect }: any) => (
        <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            <View style={styles.chipContainer}>
                {options.map((opt: string) => (
                    <TouchableOpacity
                        key={opt}
                        onPress={() => onSelect(opt)}
                        style={[
                            styles.chip, 
                            { borderColor: colors.border }, 
                            selected === opt && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                    >
                        <Text style={[styles.chipText, { color: selected === opt ? "#fff" : colors.text }]}>
                            {TRANSLATIONS[opt] || opt}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView 
            style={[styles.screen, { backgroundColor: colors.background }]} 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={[styles.title, { color: colors.text }]}>Inscription</Text>

                    {errorMessage && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    )}

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: colors.text }]}>Pseudo</Text>
                        <TextInput 
                            value={pseudo} 
                            onChangeText={setPseudo} 
                            placeholder="Nom d'utilisateur" 
                            placeholderTextColor={colors.muted} 
                            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} 
                        />
                    </View>

                    <SelectionGroup label="Régime alimentaire" options={diets} selected={selectedDiet} onSelect={setSelectedDiet} />
                    <SelectionGroup label="Objectif" options={goals} selected={selectedGoal} onSelect={setSelectedGoal} />

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                        <TextInput 
                            value={email} 
                            onChangeText={setEmail} 
                            autoCapitalize="none" 
                            keyboardType="email-address"
                            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} 
                        />
                    </View>

                    {/* Champ Mot de Passe avec Oeil */}
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: colors.text }]}>Mot de passe (min. 6 car.)</Text>
                        <View style={[styles.passwordContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                            <TextInput 
                                value={password} 
                                onChangeText={setPassword} 
                                secureTextEntry={!showPassword} 
                                style={[styles.passwordInput, { color: colors.text }]} 
                            />
                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons 
                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={22} 
                                    color={colors.muted} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity 
                        onPress={handleRegister} 
                        disabled={!canSubmit} 
                        style={[styles.button, { backgroundColor: colors.primary }, !canSubmit && { opacity: 0.5 }]}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/login" as any)} style={styles.linkButton}>
                        <Text style={[styles.linkText, { color: colors.muted }]}>
                            Déjà un compte ? <Text style={{ color: colors.text, fontWeight: "700" }}>Se connecter</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
    card: { gap: 16 },
    title: { fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 10 },
    field: { gap: 8 },
    label: { fontSize: 14, fontWeight: "600" },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
    // Styles spécifiques pour le champ mot de passe
    passwordContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderRadius: 12,
    },
    passwordInput: { 
        flex: 1, 
        padding: 14, 
        fontSize: 16 
    },
    eyeIcon: { 
        paddingHorizontal: 14 
    },
    chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    chipText: { fontSize: 13, fontWeight: "600" },
    button: { marginTop: 10, padding: 16, borderRadius: 12, alignItems: "center" },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    linkButton: { marginTop: 10, alignItems: "center" },
    linkText: { fontSize: 14 },
    errorBox: { backgroundColor: '#FF525222', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FF5252' },
    errorText: { color: "#FF5252", fontSize: 14, textAlign: "center" }
});