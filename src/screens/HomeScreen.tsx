import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ScreenProps, WorldStats } from '../types/gameTypes';
import { FACTION_COLORS } from '../types/gameTypes';

const { width, height } = Dimensions.get('window');

/**
 * Écran d'accueil du jeu avec logo, animations et navigation principale
 */
const HomeScreen: React.FC<ScreenProps> = ({
  player,
  navigateToScreen,
}) => {
  const [worldStats, setWorldStats] = useState<WorldStats | null>(null);
  const [titleAnimation] = useState(new Animated.Value(0));
  const [buttonsAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadWorldStats();
    startAnimations();
  }, []);

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
      console.error('Erreur chargement stats:', error);
    }
  };

  /**
   * Démarre les animations d'entrée
   */
  const startAnimations = (): void => {
    Animated.sequence([
      Animated.timing(titleAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Navigation vers le jeu ou création de personnage
   */
  const handlePlayButton = (): void => {
    if (player) {
      navigateToScreen('worldMap');
    } else {
      navigateToScreen('factionSelection');
    }
  };

  /**
   * Affiche les informations sur le jeu
   */
  const showGameInfo = (): void => {
    Alert.alert(
      '🎮 PURGATOIRE - Guide du Jeu',
      '⚔️ OBJECTIF:\n' +
      'Menez votre faction (Anges ou Démons) à la domination totale du monde !\n\n' +
      
      '🗺️ GAMEPLAY:\n' +
      '• Combattez dans 6 régions différentes\n' +
      '• Gagnez des batailles pour contrôler les territoires\n' +
      '• Chaque région offre des bonus uniques\n\n' +
      
      '🔥 PURGE:\n' +
      'Quand une faction contrôle 80% du monde, une PURGE se déclenche !\n' +
      'Tout est remis à zéro pour une nouvelle guerre...\n\n' +
      
      '🃏 CARTES:\n' +
      '• Créatures: Attaquent directement\n' +
      '• Sorts: Effets magiques variés\n' +
      '• Équipements: Améliorent vos capacités\n\n' +
      
      '🎯 CLASSES:\n' +
      'Chaque classe a des bonus et cartes spéciales !',
      [{ text: 'Compris !', style: 'default' }]
    );
  };

  /**
   * Réinitialise les données de jeu
   */
  const resetGameData = (): void => {
    Alert.alert(
      '⚠️ Réinitialisation',
      'Êtes-vous sûr de vouloir effacer toutes les données de jeu ?\n\nCette action est irréversible !',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'player',
                'regions',
                'worldStats',
                'gameInitialized'
              ]);
              Alert.alert('✅ Succès', 'Données effacées avec succès !');
            } catch (error) {
              Alert.alert('❌ Erreur', 'Impossible d\'effacer les données');
            }
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Particules d'arrière-plan animées */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: titleAnimation,
              }
            ]}
          />
        ))}
      </View>

      {/* Titre principal avec animation */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleAnimation,
            transform: [
              {
                translateY: titleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.gameTitle}>PURGATOIRE</Text>
        <Text style={styles.gameSubtitle}>Guerre Éternelle</Text>
        
        {/* Indicateur de faction si joueur connecté */}
        {player && (
          <View style={styles.playerIndicator}>
            <Text style={styles.welcomeText}>
              Bienvenue, {player.faction === 'angel' ? '👼' : '😈'} {player.username}
            </Text>
            <Text style={styles.playerLevel}>Niveau {player.level}</Text>
          </View>
        )}
      </Animated.View>

      {/* Statistiques mondiales */}
      {worldStats && (
        <Animated.View
          style={[
            styles.worldStatsContainer,
            { opacity: titleAnimation }
          ]}
        >
          <Text style={styles.statsTitle}>État Actuel du Monde</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: FACTION_COLORS.angel.primary }]}>
                {worldStats.totalAngels}
              </Text>
              <Text style={styles.statLabel}>👼 Anges</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{worldStats.purgeCount}</Text>
              <Text style={styles.statLabel}>🔥 Purges</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: FACTION_COLORS.demon.primary }]}>
                {worldStats.totalDemons}
              </Text>
              <Text style={styles.statLabel}>😈 Démons</Text>
            </View>
          </View>
          
          {worldStats.currentPurgeWinner && (
            <Text style={styles.lastWinner}>
              Dernière victoire: {worldStats.currentPurgeWinner === 'angel' ? '👼 Anges' : '😈 Démons'}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Boutons de navigation avec animation */}
      <Animated.View
        style={[
          styles.buttonsContainer,
          {
            opacity: buttonsAnimation,
            transform: [
              {
                translateY: buttonsAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Bouton principal */}
        <TouchableOpacity
          style={[
            styles.playButton,
            player && {
              backgroundColor: player.faction === 'angel' 
                ? FACTION_COLORS.angel.primary 
                : FACTION_COLORS.demon.primary
            }
          ]}
          onPress={handlePlayButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              player
                ? player.faction === 'angel'
                  ? [FACTION_COLORS.angel.primary, FACTION_COLORS.angel.secondary]
                  : [FACTION_COLORS.demon.primary, FACTION_COLORS.demon.secondary]
                : ['#4CAF50', '#45a049']
            }
            style={styles.playButtonGradient}
          >
            <Text style={styles.playButtonText}>
              {player ? '🗺️ CONTINUER LA GUERRE' : '⚔️ COMMENCER LA BATAILLE'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Boutons secondaires */}
        <View style={styles.secondaryButtons}>
          {player && (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigateToScreen('deck')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>🃏 Mon Deck</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigateToScreen('profile')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>👤 Profil</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={showGameInfo}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>📖 Guide</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton de réinitialisation (pour développement) */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetGameData}
          activeOpacity={0.8}
        >
          <Text style={styles.resetButtonText}>🗑️ Reset Data</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Version du jeu */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          Version 1.0.0 - Expo Go Compatible
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  titleContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  gameTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 4,
    marginBottom: 10,
  },
  gameSubtitle: {
    fontSize: 18,
    color: '#cccccc',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 2,
    marginBottom: 20,
  },
  playerIndicator: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  welcomeText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 5,
  },
  playerLevel: {
    fontSize: 14,
    color: '#cccccc',
  },
  worldStatsContainer: {
    backgroundColor: '#2a2a3e',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#444',
    width: width - 40,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
  },
  lastWinner: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonsContainer: {
    alignItems: 'center',
    width: width - 40,
    zIndex: 1,
  },
  playButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    marginBottom: 20,
  },
  playButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  secondaryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  secondaryButton: {
    backgroundColor: '#2a2a3e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
});

export default HomeScreen;