import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, TextInput, Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

type ScanResult = {
    barcode: string;
    offName: string;
    matchedIngredient: any | null;
};

export default function ScanScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();

    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [quantity, setQuantity] = useState('1');
    const [isSaving, setIsSaving] = useState(false);

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Autorisation caméra requise.</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Autoriser</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (isProcessing || scanResult) return;
        setIsProcessing(true);

        try {
            console.log("--- Début Scan Barcode:", data);
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
            const offData = await response.json();

            if (offData.status !== 1) {
                Alert.alert("Introuvable", "Produit inconnu sur Open Food Facts.");
                return;
            }

            const generic = offData.product.generic_name_fr || "";
            const brand = offData.product.brands || "";
            const name = offData.product.product_name_fr || "";

            // On cherche dans cet ordre de priorité pour le mot-clé
            const searchSource = (generic || name || brand).toLowerCase();
            const displayResult = name || generic || "Produit inconnu";

            // Nettoyage : On garde le premier vrai nom (ex: "Miel de..." -> "Miel")
            const stopWords = ['des', 'les', 'aux', 'pour', 'avec', 'bio', 'pur'];
            const words = searchSource
                .replace(/[^a-zà-ÿ]/g, ' ')
                .split(' ')
                .filter((w: string) => w.length > 2 && !stopWords.includes(w));

            const mainWord = words[0];
            console.log("Mot-clé retenu pour recherche Supabase:", mainWord);

            if (mainWord) {
                const { data: dbItems, error } = await supabase
                    .from('ingredient')
                    .select('*')
                    .is('deleted_at', null)
                    .ilike('name_fr', `%${mainWord}%`)
                    .limit(1);

                if (error) throw error;

                setScanResult({
                    barcode: data,
                    offName: displayResult,
                    matchedIngredient: dbItems?.[0] || null
                });
            } else {
                setScanResult({ barcode: data, offName: displayResult, matchedIngredient: null });
            }

        } catch (error: any) {
            console.error("Erreur Scan:", error);
            Alert.alert("Erreur", "Problème lors de la recherche produit.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddToStock = async () => {
        if (!scanResult?.matchedIngredient) return;

        const qty = Number(quantity.replace(',', '.'));
        if (isNaN(qty) || qty <= 0) {
            Alert.alert("Erreur", "Saisis une quantité valide.");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Récupération User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Session expirée. Reconnecte-toi.");

            const ingId = scanResult.matchedIngredient.id;

            // 2. Vérification existence (comme dans ma-cuisine.tsx)
            const { data: existing } = await supabase
                .from('userStock')
                .select('*')
                .eq('user_id', user.id)
                .eq('ingredient_id', ingId)
                .is('deleted_at', null)
                .maybeSingle();

            let error;
            if (existing) {
                console.log("Mise à jour stock existant...");
                const { error: err } = await supabase
                    .from('userStock')
                    .update({ quantity: existing.quantity + qty })
                    .eq('id', existing.id);
                error = err;
            } else {
                console.log("Création nouvelle ligne de stock...");
                const { error: err } = await supabase.from('userStock').insert({
                    user_id: user.id,
                    ingredient_id: ingId,
                    quantity: qty,
                });
                error = err;
            }

            if (error) throw error;

            Alert.alert("Succès", `${scanResult.matchedIngredient.name_fr} ajouté !`, [
                { text: "OK", onPress: () => router.back() }
            ]);

        } catch (err: any) {
            console.error("Erreur Insertion Stock:", err);
            Alert.alert("Erreur Database", err.message || "Impossible d'ajouter au stock.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={scanResult ? undefined : handleBarCodeScanned}
            >
                <View style={styles.topOverlay}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                        <Text style={styles.buttonText}>Retour</Text>
                    </TouchableOpacity>
                </View>

                {isProcessing && <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />}

                {scanResult && (
                    <View style={styles.resultOverlay}>
                        <Text style={styles.resultOffName}>{scanResult.offName}</Text>

                        <View style={styles.matchBox}>
                            <Text style={styles.matchLabel}>Trouvé en base :</Text>
                            <Text style={scanResult.matchedIngredient ? styles.matchSuccess : styles.matchFail}>
                                {scanResult.matchedIngredient?.name_fr || "Aucune correspondance"}
                            </Text>
                        </View>

                        {scanResult.matchedIngredient && (
                            <>
                                <View style={styles.quantityRow}>
                                    <Text style={styles.qLabel}>Quantité :</Text>
                                    <TextInput
                                        style={styles.qInput}
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleAddToStock}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Ajouter à ma cuisine</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setScanResult(null)}>
                            <Text style={styles.secondaryButtonText}>Réessayer</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1, justifyContent: 'flex-end' },
    topOverlay: { position: 'absolute', top: 50, left: 20 },
    closeButton: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    loader: { marginBottom: 100 },
    resultOverlay: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 15 },
    resultOffName: { fontSize: 20, fontWeight: 'bold', color: '#111' },
    matchBox: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10 },
    matchLabel: { fontSize: 12, color: '#666' },
    matchSuccess: { color: '#2e7d32', fontWeight: 'bold', fontSize: 16 },
    matchFail: { color: '#c62828' },
    quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qLabel: { fontWeight: '600' },
    qInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: 60, textAlign: 'center' },
    primaryButton: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, alignItems: 'center' },
    primaryButtonText: { color: '#fff', fontWeight: 'bold' },
    secondaryButton: { alignItems: 'center', padding: 10 },
    secondaryButtonText: { color: '#666' },
    text: { color: '#fff', textAlign: 'center', marginTop: 100 },
    button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignSelf: 'center' }
});