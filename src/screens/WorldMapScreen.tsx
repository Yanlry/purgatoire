import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { 
  ScreenProps, 
  Region, 
  WorldStats, 
  FactionType 
} from '../types/gameTypes';
import { 
  FACTION_COLORS 
} from '../types/gameTypes';
import { generateRandomBot } from '../services/gameService';

const { width, height } = Dimensions.get('window');

/**
 * Écran de la carte du monde - Hub principal du jeu
 * Affiche les régions, leur contrôle par faction, et permet de lancer des combats
 */
const WorldMapScreen: React.FC<ScreenProps> = ({
  player,
  setPlayer,
  navigateToScreen,
}) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [worldStats, setWorldStats] = useState<WorldStats | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadWorldData();
  }, []);

  /**
   * Charge les données du monde depuis AsyncStorage
   */
  const loadWorldData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const [regionsData, statsData] = await Promise.all([
        AsyncStorage.getItem('regions'),
        AsyncStorage.getItem('worldStats')
      ]);

      if (regionsData) {
        setRegions(JSON.parse(regionsData));
      }

      if (statsData) {
        setWorldStats(JSON.parse(statsData));
      }
    } catch (error) {
      console.error('Erreur chargement monde:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du monde');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calcule le pourcentage de contrôle d'une région
   */
  const getRegionControlPercentage = (region: Region): { angel: number; demon: number } => {
    const total = region.angelPoints + region.demonPoints;
    if (total === 0) return { angel: 50, demon: 50 };
    
    return {
      angel: Math.round((region.angelPoints / total) * 100),
      demon: Math.round((region.demonPoints / total) * 100)
    };
  };

  /**
   * Détermine la couleur dominante d'une région
   */
  const getRegionColor = (region: Region): string => {
    const control = getRegionControlPercentage(region);
    
    if (control.angel > 60) {
      return FACTION_COLORS.angel.primary;
    } else if (control.demon > 60) {
      return FACTION_COLORS.demon.primary;
    } else {
      return '#666666'; // Neutre
    }
  };

  /**
   * Lance un combat dans une région
   */
  const startBattle = (region: Region): void => {
    if (!player) return;

    if (region.isLocked) {
      Alert.alert('Région Verrouillée', 'Cette région ne peut pas encore être conquise.');
      return;
    }

    // Génère un ennemi de la faction opposée si la région est contrôlée
    const opponentFaction = region.controllingFaction === player.faction 
      ? (player.faction === 'angel' ? 'demon' : 'angel')
      : region.controllingFaction || (player.faction === 'angel' ? 'demon' : 'angel');

    Alert.alert(
      'Combat',
      `Vous allez affronter un ${opponentFaction === 'angel' ? 'Ange' : 'Démon'} dans ${region.name}.\n\nBonus régional: ${region.bonus.description}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Combattre', 
          onPress: () => {
            // Navigation vers l'écran de combat avec les données de la région
            navigateToScreen('battle');
          }
        }
      ]
    );
  };

  /**
   * Affiche les détails d'une région
   */
  const showRegionDetails = (region: Region): void => {
    setSelectedRegion(region);
    const control = getRegionControlPercentage(region);
    
    Alert.alert(
      region.name,
      `${region.description}\n\n` +
      `Contrôle:\n` +
      `👼 Anges: ${control.angel}%\n` +
      `😈 Démons: ${control.demon}%\n\n` +
      `Bonus: ${region.bonus.name}\n` +
      `${region.bonus.description}`,
      [
        { text: 'Fermer', style: 'cancel' },
        { 
          text: 'Combattre', 
          onPress: () => startBattle(region),
          style: region.isLocked ? 'destructive' : 'default'
        }
      ]
    );
  };

  if (!player) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur: Aucun joueur trouvé</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigateToScreen('factionSelection')}
        >
          <Text style={styles.buttonText}>Créer un personnage</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Header avec infos joueur */}
      <View style={styles.header}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {player.faction === 'angel' ? '👼' : '😈'} {player.username}
          </Text>
          <Text style={styles.playerDetails}>
            Niveau {player.level} • {player.wins}V/{player.losses}D
          </Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigateToScreen('deck')}
          >
            <Text style={styles.headerButtonText}>🃏 Deck</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigateToScreen('profile')}
          >
            <Text style={styles.headerButtonText}>👤 Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistiques globales */}
      {worldStats && (
        <View style={styles.worldStatsContainer}>
          <Text style={styles.worldStatsTitle}>État du Monde</Text>
          <View style={styles.worldStatsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Anges</Text>
              <Text style={[styles.statValue, { color: FACTION_COLORS.angel.primary }]}>
                {worldStats.totalAngels}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Démons</Text>
              <Text style={[styles.statValue, { color: FACTION_COLORS.demon.primary }]}>
                {worldStats.totalDemons}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Purges</Text>
              <Text style={styles.statValue}>{worldStats.purgeCount}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Carte du monde */}
      <ScrollView 
        style={styles.mapContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadWorldData} />
        }
      >
        <View style={styles.mapGrid}>
          {regions.map((region) => {
            const control = getRegionControlPercentage(region);
            const regionColor = getRegionColor(region);
            
            return (
              <TouchableOpacity
                key={region.id}
                style={[
                  styles.regionCard,
                  { borderColor: regionColor },
                  region.isLocked && styles.lockedRegion
                ]}
                onPress={() => showRegionDetails(region)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    region.controllingFaction === 'angel' 
                      ? FACTION_COLORS.angel.background 
                      : region.controllingFaction === 'demon'
                      ? FACTION_COLORS.demon.background
                      : '#2a2a3e',
                    '#1a1a2e'
                  ]}
                  style={styles.regionGradient}
                >
                  {region.isLocked && (
                    <View style={styles.lockIcon}>
                      <Text style={styles.lockText}>🔒</Text>
                    </View>
                  )}
                  
                  <Text style={styles.regionName}>{region.name}</Text>
                  
                  {/* Barre de contrôle */}
                  <View style={styles.controlBar}>
                    <View 
                      style={[
                        styles.controlSegment,
                        {
                          width: `${control.angel}%`,
                          backgroundColor: FACTION_COLORS.angel.primary
                        }
                      ]}
                    />
                    <View 
                      style={[
                        styles.controlSegment,
                        {
                          width: `${control.demon}%`,
                          backgroundColor: FACTION_COLORS.demon.primary
                        }
                      ]}
                    />
                  </View>
                  
                  <View style={styles.controlNumbers}>
                    <Text style={[styles.controlText, { color: FACTION_COLORS.angel.primary }]}>
                      👼 {control.angel}%
                    </Text>
                    <Text style={[styles.controlText, { color: FACTION_COLORS.demon.primary }]}>
                      😈 {control.demon}%
                    </Text>
                  </View>
                  
                  <Text style={styles.regionBonus}>
                    🎁 {region.bonus.name}
                  </Text>
                  
                  {!region.isLocked && (
                    <TouchableOpacity
                      style={[
                        styles.battleButton,
                        { backgroundColor: regionColor }
                      ]}
                      onPress={() => startBattle(region)}
                    >
                      <Text style={styles.battleButtonText}>⚔️ Combattre</Text>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
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
    paddingBottom: 20,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerDetails: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  worldStatsContainer: {
    backgroundColor: '#2a2a3e',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  worldStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  worldStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  mapContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mapGrid: {
    gap: 15,
    paddingBottom: 30,
  },
  regionCard: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  lockedRegion: {
    opacity: 0.6,
  },
  regionGradient: {
    padding: 15,
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  lockText: {
    fontSize: 20,
  },
  regionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  controlBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  controlSegment: {
    height: '100%',
  },
  controlNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  controlText: {
    fontSize: 12,
    fontWeight: '600',
  },
  regionBonus: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 10,
  },
  battleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  battleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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

export default WorldMapScreen;