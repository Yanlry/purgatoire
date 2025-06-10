import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import FactionSelectionScreen from './src/screens/FactionSelectionScreen';
import WorldMapScreen from './src/screens/WorldMapScreen';
import DeckScreen from './src/screens/DeckScreen';
import BattleScreen from './src/screens/BattleScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Context
import { GameProvider } from './src/contexts/GameContext';

// Types
import type { Player, FactionType, ClassType } from './src/types/gameTypes';

// Services
import { initializeGameData, createStarterDeck } from './src/services/gameService';

export type ScreenType = 'home' | 'factionSelection' | 'worldMap' | 'deck' | 'battle' | 'profile';

/**
 * Application principale du jeu Ange vs Démon pour Expo Go
 * Navigation simple et compatible avec toutes les versions d'Expo
 */
export default function App(): React.ReactElement {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Initialise l'application et charge les données joueur
   */
  const initializeApp = async (): Promise<void> => {
    try {
      // Initialise les données du jeu
      await initializeGameData();
      
      // Charge le joueur existant ou va à la sélection de faction
      const savedPlayer = await loadPlayer();
      if (savedPlayer) {
        setPlayer(savedPlayer);
        setCurrentScreen('worldMap');
      } else {
        setCurrentScreen('factionSelection');
      }
    } catch (error) {
      console.error('Erreur initialisation:', error);
      Alert.alert('Erreur', 'Impossible de charger le jeu');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Charge les données joueur depuis AsyncStorage
   */
  const loadPlayer = async (): Promise<Player | null> => {
    try {
      const playerData = await AsyncStorage.getItem('player');
      return playerData ? JSON.parse(playerData) : null;
    } catch (error) {
      console.error('Erreur chargement joueur:', error);
      return null;
    }
  };

  /**
   * Sauvegarde les données joueur
   */
  const savePlayer = async (playerData: Player): Promise<void> => {
    try {
      await AsyncStorage.setItem('player', JSON.stringify(playerData));
      setPlayer(playerData);
    } catch (error) {
      console.error('Erreur sauvegarde joueur:', error);
    }
  };

  /**
   * Crée un nouveau joueur
   */
  const createPlayer = async (username: string, faction: FactionType, playerClass: ClassType): Promise<void> => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      username,
      faction,
      class: playerClass,
      level: 1,
      experience: 0,
      wins: 0,
      losses: 0,
      deck: createStarterDeck(faction, playerClass),
      collection: createStarterDeck(faction, playerClass),
      reputation: 0,
      isConverted: false,
      createdAt: new Date(),
    };

    await savePlayer(newPlayer);
    setCurrentScreen('worldMap');
  };

  /**
   * Navigation entre les écrans
   */
  const navigateToScreen = (screen: ScreenType): void => {
    setCurrentScreen(screen);
  };

  /**
   * Props communes à passer aux écrans
   */
  const screenProps = {
    player,
    setPlayer: savePlayer,
    navigateToScreen,
  };

  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <GameProvider>
      <View style={styles.container}>
        {currentScreen === 'home' && (
          <HomeScreen {...screenProps} />
        )}
        {currentScreen === 'factionSelection' && (
          <FactionSelectionScreen
            {...screenProps}
            onPlayerCreated={createPlayer}
          />
        )}
        {currentScreen === 'worldMap' && (
          <WorldMapScreen {...screenProps} />
        )}
        {currentScreen === 'deck' && (
          <DeckScreen {...screenProps} />
        )}
        {currentScreen === 'battle' && (
          <BattleScreen {...screenProps} />
        )}
        {currentScreen === 'profile' && (
          <ProfileScreen {...screenProps} />
        )}
        <StatusBar style="light" />
      </View>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});