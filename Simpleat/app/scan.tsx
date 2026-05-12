import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

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

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Simpl'eat a besoin de ton autorisation pour utiliser la caméra.</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Autoriser la caméra</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (isProcessing || scanResult) return;

        setIsProcessing(true);

        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
            const offData = await response.json();

            if (offData.status !== 1) {
                alert("Ce produit est introuvable sur Open Food Facts.");
                setIsProcessing(false);
                return;
            }

            const genericName = offData.product.generic_name_fr || offData.product.generic_name || "";
            const commercialName = offData.product.product_name_fr || offData.product.product_name || "";
            const displayProductName = commercialName || genericName || "Produit inconnu";
            const textToSearch = (genericName + " " + commercialName).toLowerCase();
            const stopWords = ['des', 'les', 'aux', 'sur', 'pour', 'avec', 'sans', 'pur', 'bio'];

            const words = textToSearch
                .replace(/[^a-zà-ÿ]/g, ' ')
                .split(' ')
                .filter(w => w.trim().length > 2 && !stopWords.includes(w.trim()));

            const searchWord = words.length > 0 ? words[0] : null;

            let dbIngredients = null;

            if (searchWord) {
                const { data: matchedData, error } = await supabase
                    .from('ingredient')
                    .select('*')
                    .is('deleted_at', null)
                    .ilike('name_fr', `%${searchWord}%`)
                    .limit(1);

                if (error) throw error;
                dbIngredients = matchedData;
            }

            setScanResult({
                barcode: data,
                offName: displayProductName,
                matchedIngredient: dbIngredients && dbIngredients.length > 0 ? dbIngredients[0] : null
            });

        } catch (error) {
            console.error("Erreur lors du scan :", error);
            alert("Une erreur est survenue lors de la recherche du produit.");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScan = () => {
        setScanResult(null);
        setIsProcessing(false);
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanResult ? undefined : handleBarCodeScanned}
            >
                <View style={styles.topOverlay}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                        <Text style={styles.buttonText}>Retour</Text>
                    </TouchableOpacity>
                </View>

                {isProcessing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Recherche du produit...</Text>
                    </View>
                )}

                {scanResult && (
                    <View style={styles.resultOverlay}>
                        <Text style={styles.resultTitle}>Produit scanné :</Text>
                        <Text style={styles.resultOffName}>{scanResult.offName}</Text>

                        <View style={styles.matchBox}>
                            <Text style={styles.matchLabel}>Correspondance Supabase :</Text>
                            {scanResult.matchedIngredient ? (
                                <Text style={styles.matchSuccess}>
                                    {scanResult.matchedIngredient.name_fr}
                                </Text>
                            ) : (
                                <Text style={styles.matchFail}>
                                    Aucun ingrédient trouvé en base.
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={() => alert('Bientôt : Ajout au stock !')}>
                            <Text style={styles.primaryButtonText}>Ajouter au stock</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={resetScan}>
                            <Text style={styles.secondaryButtonText}>Scanner un autre produit</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1, justifyContent: 'space-between' },

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: { color: '#fff', marginTop: 10, fontSize: 16, fontWeight: 'bold' },

    topOverlay: {
        paddingTop: 50,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
    },
    closeButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    resultOverlay: {
        backgroundColor: '#fff',
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        gap: 12,
    },
    resultTitle: { fontSize: 14, color: '#666', fontWeight: '600' },
    resultOffName: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 8 },

    matchBox: {
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    matchLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
    matchSuccess: { fontSize: 16, color: '#2e7d32', fontWeight: 'bold' },
    matchFail: { fontSize: 14, color: '#c62828' },

    // Buttons
    primaryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    secondaryButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },

    text: { color: '#fff', textAlign: 'center', marginBottom: 20, fontSize: 16, paddingHorizontal: 20 },
    button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 12, marginHorizontal: 40, alignItems: 'center' },
});