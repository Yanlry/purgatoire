import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { 
  FactionSelectionProps, 
  FactionType, 
  ClassType 
} from '../types/gameTypes';
import { 
  FACTION_COLORS
} from '../types/gameTypes';

const { width, height } = Dimensions.get('window');

// Définition des bonus de classe directement dans le fichier pour éviter les erreurs d'import
const CLASS_BONUSES = {
  mage: {
    name: 'Mage',
    description: 'Maître des sorts élémentaires',
    healthBonus: 0,
    manaBonus: 2,
    specialAbility: 'Sorts +1 dégât'
  },
  warrior: {
    name: 'Guerrier',
    description: 'Combattant au corps à corps',
    healthBonus: 5,
    manaBonus: 0,
    specialAbility: 'Créatures +1 attaque'
  },
  paladin: {
    name: 'Paladin',
    description: 'Protecteur sacré',
    healthBonus: 3,
    manaBonus: 1,
    specialAbility: 'Sorts de soin +2'
  },
  necromancer: {
    name: 'Nécromancien',
    description: 'Maître des morts-vivants',
    healthBonus: 1,
    manaBonus: 1,
    specialAbility: 'Invoque des squelettes'
  },
  shaman: {
    name: 'Chaman',
    description: 'Équilibre entre nature et magie',
    healthBonus: 2,
    manaBonus: 1,
    specialAbility: 'Buffs +1 tour'
  }
} as const;

/**
 * Écran de sélection de faction et classe pour nouveaux joueurs
 * Interface immersive avec thème Ange vs Démon
 */
const FactionSelectionScreen: React.FC<FactionSelectionProps> = ({
  onPlayerCreated,
  navigateToScreen,
}) => {
  const [selectedFaction, setSelectedFaction] = useState<FactionType | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [username, setUsername] = useState<string>('');
  const [step, setStep] = useState<'faction' | 'class' | 'name'>('faction');

  /**
   * Gère la sélection de faction
   */
  const handleFactionSelect = (faction: FactionType): void => {
    setSelectedFaction(faction);
    setStep('class');
  };

  /**
   * Gère la sélection de classe
   */
  const handleClassSelect = (playerClass: ClassType): void => {
    setSelectedClass(playerClass);
    setStep('name');
  };

  /**
   * Crée le joueur et démarre le jeu
   */
  const handleCreatePlayer = async (): Promise<void> => {
    if (!selectedFaction || !selectedClass || !username.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Erreur', 'Le nom doit contenir au moins 3 caractères');
      return;
    }

    try {
      await onPlayerCreated(username.trim(), selectedFaction, selectedClass);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le joueur');
    }
  };

  /**
   * Retour à l'étape précédente
   */
  const handleBack = (): void => {
    if (step === 'class') {
      setStep('faction');
      setSelectedFaction(null);
    } else if (step === 'name') {
      setStep('class');
      setSelectedClass(null);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PURGATOIRE</Text>
          <Text style={styles.subtitle}>Choisissez votre destinée</Text>
        </View>

        {/* Étape 1: Sélection de Faction */}
        {step === 'faction' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choisissez votre faction</Text>
            <Text style={styles.stepDescription}>
              Dans cette guerre éternelle, de quel côté vous battrez-vous ?
            </Text>

            <View style={styles.factionsContainer}>
              
              {/* Faction Ange */}
              <TouchableOpacity
                style={[
                  styles.factionCard,
                  { borderColor: FACTION_COLORS.angel.primary }
                ]}
                onPress={() => handleFactionSelect('angel')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[FACTION_COLORS.angel.background, FACTION_COLORS.angel.secondary]}
                  style={styles.factionGradient}
                >
                  <Text style={[styles.factionEmoji, { color: FACTION_COLORS.angel.primary }]}>
                    👼
                  </Text>
                  <Text style={[styles.factionName, { color: FACTION_COLORS.angel.dark }]}>
                    ANGES
                  </Text>
                  <Text style={[styles.factionDescription, { color: FACTION_COLORS.angel.dark }]}>
                    Lumière • Justice • Ordre{'\n'}
                    Protégez les innocents et purifiez le mal
                  </Text>
                  <View style={styles.factionStats}>
                    <Text style={[styles.statText, { color: FACTION_COLORS.angel.dark }]}>
                      ⚔️ Soin et Protection
                    </Text>
                    <Text style={[styles.statText, { color: FACTION_COLORS.angel.dark }]}>
                      🛡️ Résistance élevée
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Faction Démon */}
              <TouchableOpacity
                style={[
                  styles.factionCard,
                  { borderColor: FACTION_COLORS.demon.primary }
                ]}
                onPress={() => handleFactionSelect('demon')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[FACTION_COLORS.demon.background, FACTION_COLORS.demon.secondary]}
                  style={styles.factionGradient}
                >
                  <Text style={[styles.factionEmoji, { color: FACTION_COLORS.demon.primary }]}>
                    😈
                  </Text>
                  <Text style={[styles.factionName, { color: '#ffffff' }]}>
                    DÉMONS
                  </Text>
                  <Text style={[styles.factionDescription, { color: '#ffffff' }]}>
                    Chaos • Destruction • Pouvoir{'\n'}
                    Dominez vos ennemis par la force brute
                  </Text>
                  <View style={styles.factionStats}>
                    <Text style={[styles.statText, { color: '#ffffff' }]}>
                      🔥 Attaque puissante
                    </Text>
                    <Text style={[styles.statText, { color: '#ffffff' }]}>
                      ⚡ Rapidité d'action
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Étape 2: Sélection de Classe */}
        {step === 'class' && selectedFaction && (
          <View style={styles.stepContainer}>
            <View style={styles.backButton}>
              <TouchableOpacity onPress={handleBack} style={styles.backButtonTouch}>
                <Text style={styles.backButtonText}>← Retour</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.stepTitle}>Choisissez votre classe</Text>
            <Text style={styles.stepDescription}>
              Faction: {selectedFaction === 'angel' ? '👼 Anges' : '😈 Démons'}
            </Text>

            <View style={styles.classesContainer}>
              {(Object.keys(CLASS_BONUSES) as ClassType[]).map((classKey) => {
                const classData = CLASS_BONUSES[classKey];
                return (
                  <TouchableOpacity
                    key={classKey}
                    style={[
                      styles.classCard,
                      {
                        borderColor: selectedFaction === 'angel' 
                          ? FACTION_COLORS.angel.primary 
                          : FACTION_COLORS.demon.primary
                      }
                    ]}
                    onPress={() => handleClassSelect(classKey)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.classContent}>
                      <Text style={styles.className}>{classData.name}</Text>
                      <Text style={styles.classDescription}>{classData.description}</Text>
                      
                      <View style={styles.classBonuses}>
                        <Text style={styles.bonusText}>
                          ❤️ +{classData.healthBonus} Santé
                        </Text>
                        <Text style={styles.bonusText}>
                          💎 +{classData.manaBonus} Mana
                        </Text>
                        <Text style={styles.bonusText}>
                          ⭐ {classData.specialAbility}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Étape 3: Nom d'utilisateur */}
        {step === 'name' && selectedFaction && selectedClass && (
          <View style={styles.stepContainer}>
            <View style={styles.backButton}>
              <TouchableOpacity onPress={handleBack} style={styles.backButtonTouch}>
                <Text style={styles.backButtonText}>← Retour</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.stepTitle}>Choisissez votre nom</Text>
            
            <View style={styles.selectionSummary}>
              <Text style={styles.summaryText}>
                Faction: {selectedFaction === 'angel' ? '👼 Anges' : '😈 Démons'}
              </Text>
              <Text style={styles.summaryText}>
                Classe: {CLASS_BONUSES[selectedClass].name}
              </Text>
            </View>

            <TextInput
              style={[
                styles.usernameInput,
                {
                  borderColor: selectedFaction === 'angel' 
                    ? FACTION_COLORS.angel.primary 
                    : FACTION_COLORS.demon.primary
                }
              ]}
              placeholder="Entrez votre nom de guerrier..."
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              maxLength={20}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: selectedFaction === 'angel' 
                    ? FACTION_COLORS.angel.primary 
                    : FACTION_COLORS.demon.primary
                }
              ]}
              onPress={handleCreatePlayer}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>
                🎮 COMMENCER L'AVENTURE
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginTop: 5,
    fontStyle: 'italic',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonTouch: {
    padding: 10,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 30,
  },
  factionsContainer: {
    width: '100%',
    gap: 20,
  },
  factionCard: {
    borderRadius: 15,
    borderWidth: 3,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  factionGradient: {
    padding: 25,
    alignItems: 'center',
  },
  factionEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  factionName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 2,
  },
  factionDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  factionStats: {
    gap: 5,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  classesContainer: {
    width: '100%',
    gap: 15,
  },
  classCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
  },
  classContent: {
    alignItems: 'center',
  },
  className: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  classDescription: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 15,
  },
  classBonuses: {
    gap: 8,
    alignItems: 'center',
  },
  bonusText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
  selectionSummary: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 5,
  },
  usernameInput: {
    width: '100%',
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    borderWidth: 2,
    padding: 15,
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default FactionSelectionScreen;