import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SimpliaScreen() {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');

  return (
    <ImageBackground
      source={require('@/assets/images/fond_picto_all.png')}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { paddingTop: Math.max(0, insets.top) }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/broco_cooking.png')} 
            style={styles.mascotHeader} 
            resizeMode="contain" 
          />
          <View style={styles.titleRow}>
            <Text style={styles.titleDark}>Simpl'</Text>
            <Text style={styles.titleHighlight}>IA</Text>
          </View>
        </View>

        {/* --- CARTE PRINCIPALE --- */}
        <View style={styles.card}>
          
          {/* Contenu centré (Message + Mascotte) */}
          <View style={styles.contentCenter}>
            <Text style={styles.greetingText}>
              Comment puis-je vous{'\n'}aider aujourd'hui ?
            </Text>
            
            <Image 
              source={require('@/assets/images/broco_waving.png')} 
              style={styles.mascotCenter} 
              resizeMode="contain" 
            />
          </View>

          {/* Zone de saisie (Input) */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Je veux cuisiner du chou-fleur"
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
            />
            <Pressable 
              style={styles.sendButton}
              onPress={() => {
                console.log("Message envoyé :", inputText);
                setInputText('');
              }}
            >
              <Ionicons name="paper-plane" size={20} color="#FFFFFF" style={styles.sendIcon} />
            </Pressable>
          </View>

        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#F7F3EA',
  },
  backgroundImageStyle: {
    opacity: 0.15,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    marginBottom: 10,
  },
  mascotHeader: {
    width: 70,
    height: 70,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleDark: {
    fontSize: 34,
    fontWeight: '600',
    color: '#496943',
  },
  titleHighlight: {
    fontSize: 34,
    fontWeight: '600',
    color: '#F9AB24',
  },

  // CARD
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    justifyContent: 'space-between',
  },

  // CONTENU CENTRAL
  contentCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40, 
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#496943',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 40,
  },
  mascotCenter: {
    width: 120,
    height: 120,
  },

  // INPUT
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F3EA',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#496943',
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#496943',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendIcon: {
    marginLeft: -2,
  },
});