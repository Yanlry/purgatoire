import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { 
  ScreenProps, 
  FactionType, 
  ClassType, 
  WorldStats 
} from '../types/gameTypes';
import { 
  FACTION_COLORS 
} from '../types/gameTypes';

const { width } = Dimensions.get('window');

// Définition locale des bonus de classe pour éviter les erreurs d'import
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
 * Écran de profil du joueur avec statistiques détaillées et options de compte
 */
const ProfileScreen: React.FC<ScreenProps> = ({
  player,
  setPlayer,
  navigateToScreen,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [worldStats, setWorldStats] = useState<WorldStats | null>(null);

  useEffect(() => {
    if (player) {
      setNewUsername(player.username);
    }
    loadWorldStats();
  }, [player]);

  /**
   * Charge les statistiques du monde
   */
  const loadWorldStats = async (): Promise<void> => {
    try {
      const statsData = await AsyncStorage.getItem('worldStats');
      if (statsData) {
        setWorldStats(JSON.parse(statsData));
      }
    } catch (error) {
      console.error('Erreur chargement stats monde:', error);
    }
  };

  if (!player) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur: Aucun joueur trouvé</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigateToScreen('home')}
        >
          <Text style={styles.buttonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Calcule l'expérience nécessaire pour le prochain niveau
   */
  const getExperienceForNextLevel = (): number => {
    return (player.level) * 1000;
  };

  /**
   * Calcule le pourcentage de progression vers le prochain niveau
   */
  const getLevelProgress = (): number => {
    const currentLevelExp = (player.level - 1) * 1000;
    const nextLevelExp = player.level * 1000;
    const progress = ((player.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  /**
   * Calcule le ratio victoire/défaite
   */
  const getWinRate = (): number => {
    const totalGames = player.wins + player.losses;
    if (totalGames === 0) return 0;
    return (player.wins / totalGames) * 100;
  };

  /**
   * Sauvegarde le nouveau nom d'utilisateur
   */
  const saveUsername = async (): Promise<void> => {
    if (!newUsername.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }

    if (newUsername.trim().length < 3) {
      Alert.alert('Erreur', 'Le nom doit contenir au moins 3 caractères');
      return;
    }

    try {
      const updatedPlayer = {
        ...player,
        username: newUsername.trim()
      };
      
      await setPlayer(updatedPlayer);
      setIsEditing(false);
      Alert.alert('✅ Succès', 'Nom d\'utilisateur modifié !');
    } catch (error) {
      Alert.alert('❌ Erreur', 'Impossible de modifier le nom');
    }
  };

  /**
   * Change de faction (conversion)
   */
  const changeFaction = (): void => {
    const opposingFaction: FactionType = player.faction === 'angel' ? 'demon' : 'angel';
    const factionName = opposingFaction === 'angel' ? 'Anges' : 'Démons';
    
    Alert.alert(
      '🔄 Conversion de Faction',
      `Êtes-vous sûr de vouloir rejoindre les ${factionName} ?\n\n` +
      `⚠️ Attention:\n` +
      `• Votre deck sera partiellement réinitialisé\n` +
      `• Vous conserverez votre niveau et expérience\n` +
      `• Votre réputation sera remise à zéro\n` +
      `• Cette action est irréversible !`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer la conversion',
          style: 'destructive',
          onPress: async () => {
            try {
              // Importe le service pour créer un nouveau deck
              const { createStarterDeck } = require('../services/gameService');
              
              const updatedPlayer = {
                ...player,
                faction: opposingFaction,
                deck: createStarterDeck(opposingFaction, player.class),
                collection: createStarterDeck(opposingFaction, player.class),
                reputation: 0,
                isConverted: true,
              };
              
              await setPlayer(updatedPlayer);
              Alert.alert(
                '🎉 Conversion Réussie !', 
                `Bienvenue chez les ${factionName} !\n\nVotre nouveau deck vous attend.`
              );
            } catch (error) {
              Alert.alert('❌ Erreur', 'Impossible de changer de faction');
            }
          }
        }
      ]
    );
  };

  /**
   * Supprime le compte joueur
   */
  const deleteAccount = (): void => {
    Alert.alert(
      '⚠️ Supprimer le Compte',
      'Êtes-vous absolument certain de vouloir supprimer votre compte ?\n\n' +
      'Toutes vos données seront définitivement perdues !\n\n' +
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('player');
              Alert.alert(
                '✅ Compte Supprimé',
                'Votre compte a été supprimé avec succès.',
                [{ text: 'OK', onPress: () => navigateToScreen('home') }]
              );
            } catch (error) {
              Alert.alert('❌ Erreur', 'Impossible de supprimer le compte');
            }
          }
        }
      ]
    );
  };

  const levelProgress = getLevelProgress();
  const winRate = getWinRate();
  const classData = CLASS_BONUSES[player.class];

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigateToScreen('worldMap')}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Profil du Guerrier</Text>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? '❌' : '✏️'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Carte de profil principale */}
        <View style={[
          styles.profileCard,
          { borderColor: FACTION_COLORS[player.faction].primary }
        ]}>
          <LinearGradient
            colors={[
              FACTION_COLORS[player.faction].background,
              '#2a2a3e'
            ]}
            style={styles.profileGradient}
          >
            {/* Avatar et nom */}
            <View style={styles.profileHeader}>
              <Text style={[
                styles.factionEmoji,
                { color: FACTION_COLORS[player.faction].primary }
              ]}>
                {player.faction === 'angel' ? '👼' : '😈'}
              </Text>
              
              {isEditing ? (
                <View style={styles.editNameContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={newUsername}
                    onChangeText={setNewUsername}
                    placeholder="Nouveau nom..."
                    placeholderTextColor="#888"
                    maxLength={20}
                  />
                  <TouchableOpacity style={styles.saveNameButton} onPress={saveUsername}>
                    <Text style={styles.saveNameText}>✅</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[
                  styles.playerName,
                  { color: player.faction === 'angel' ? FACTION_COLORS.angel.dark : '#ffffff' }
                ]}>
                  {player.username}
                </Text>
              )}
            </View>

            {/* Informations de base */}
            <View style={styles.basicInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Faction:</Text>
                <Text style={[
                  styles.infoValue,
                  { color: FACTION_COLORS[player.faction].primary }
                ]}>
                  {player.faction === 'angel' ? 'Anges' : 'Démons'}
                  {player.isConverted && ' (Converti)'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Classe:</Text>
                <Text style={styles.infoValue}>{classData.name}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Niveau:</Text>
                <Text style={styles.infoValue}>{player.level}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Réputation:</Text>
                <Text style={[
                  styles.infoValue,
                  { color: player.reputation >= 0 ? '#4CAF50' : '#f44336' }
                ]}>
                  {player.reputation}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Progression d'expérience */}
        <View style={styles.experienceCard}>
          <Text style={styles.cardTitle}>Progression d'Expérience</Text>
          <View style={styles.experienceInfo}>
            <Text style={styles.experienceText}>
              {player.experience} / {getExperienceForNextLevel()} XP
            </Text>
            <Text style={styles.experiencePercent}>
              {levelProgress.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.experienceBar}>
            <View 
              style={[
                styles.experienceFill,
                {
                  width: `${levelProgress}%`,
                  backgroundColor: FACTION_COLORS[player.faction].primary
                }
              ]}
            />
          </View>
        </View>

        {/* Statistiques de combat */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Statistiques de Combat</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{player.wins}</Text>
              <Text style={styles.statLabel}>Victoires</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{player.losses}</Text>
              <Text style={styles.statLabel}>Défaites</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{player.wins + player.losses}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[
                styles.statNumber,
                { color: winRate >= 50 ? '#4CAF50' : '#f44336' }
              ]}>
                {winRate.toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Taux de victoire</Text>
            </View>
          </View>
        </View>

        {/* Informations sur la classe */}
        <View style={styles.classCard}>
          <Text style={styles.cardTitle}>Spécialisation de Classe</Text>
          <Text style={styles.className}>{classData.name}</Text>
          <Text style={styles.classDescription}>{classData.description}</Text>
          <View style={styles.classBonuses}>
            <Text style={styles.bonusText}>❤️ +{classData.healthBonus} Santé de base</Text>
            <Text style={styles.bonusText}>💎 +{classData.manaBonus} Mana de base</Text>
            <Text style={styles.bonusText}>⭐ {classData.specialAbility}</Text>
          </View>
        </View>

        {/* Informations sur le deck */}
        <View style={styles.deckCard}>
          <Text style={styles.cardTitle}>Deck et Collection</Text>
          <View style={styles.deckStats}>
            <View style={styles.deckStatItem}>
              <Text style={styles.deckStatNumber}>{player.deck.length}</Text>
              <Text style={styles.deckStatLabel}>Cartes dans le deck</Text>
            </View>
            <View style={styles.deckStatItem}>
              <Text style={styles.deckStatNumber}>{player.collection.length}</Text>
              <Text style={styles.deckStatLabel}>Cartes possédées</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deckButton}
            onPress={() => navigateToScreen('deck')}
          >
            <Text style={styles.deckButtonText}>🃏 Gérer le Deck</Text>
          </TouchableOpacity>
        </View>

        {/* Actions du compte */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Actions du Compte</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.conversionButton]}
            onPress={changeFaction}
          >
            <Text style={styles.actionButtonText}>
              🔄 Rejoindre les {player.faction === 'angel' ? 'Démons' : 'Anges'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={deleteAccount}
          >
            <Text style={styles.actionButtonText}>🗑️ Supprimer le Compte</Text>
          </TouchableOpacity>
        </View>

        {/* Informations sur le monde */}
        {worldStats && (
          <View style={styles.worldCard}>
            <Text style={styles.cardTitle}>État du Monde</Text>
            <View style={styles.worldInfo}>
              <Text style={styles.worldText}>
                Purges totales: {worldStats.purgeCount}
              </Text>
              {worldStats.currentPurgeWinner && (
                <Text style={styles.worldText}>
                  Dernière victoire: {worldStats.currentPurgeWinner === 'angel' ? '👼 Anges' : '😈 Démons'}
                </Text>
              )}
              {worldStats.lastPurgeDate && (
                <Text style={styles.worldText}>
                  Dernière purge: {new Date(worldStats.lastPurgeDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Informations sur l'inscription */}
        <View style={styles.accountInfo}>
          <Text style={styles.accountText}>
            Compte créé le: {new Date(player.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.accountText}>
            ID Joueur: {player.id}
          </Text>
        </View>

      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    borderRadius: 15,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileGradient: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  factionEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  saveNameButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 10,
  },
  saveNameText: {
    fontSize: 16,
  },
  basicInfo: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#cccccc',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  experienceCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  experienceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  experienceText: {
    fontSize: 14,
    color: '#cccccc',
  },
  experiencePercent: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  experienceBar: {
    height: 10,
    backgroundColor: '#444',
    borderRadius: 5,
    overflow: 'hidden',
  },
  experienceFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
  },
  classCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
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
  deckCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  deckStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  deckStatItem: {
    alignItems: 'center',
  },
  deckStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  deckStatLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
  },
  deckButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deckButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  conversionButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  worldCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  worldInfo: {
    gap: 8,
  },
  worldText: {
    fontSize: 14,
    color: '#cccccc',
  },
  accountInfo: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  accountText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;