import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { 
  GameContextValue, 
  WorldStats, 
  Region, 
  FactionType, 
  BotPlayer 
} from '../types/gameTypes';
import { generateRandomBot, checkPurgeCondition } from '../services/gameService';

// Contexte pour l'état global du jeu
const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

/**
 * Provider du contexte de jeu - Gère l'état global de l'application
 */
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [worldStats, setWorldStats] = useState<WorldStats>({
    totalAngels: 0,
    totalDemons: 0,
    purgeCount: 0,
    currentPurgeWinner: null,
    lastPurgeDate: null,
    regions: [],
    activeEvents: []
  });
  
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorldData();
  }, []);

  /**
   * Charge les données du monde depuis AsyncStorage
   */
  const loadWorldData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const [regionsData, statsData] = await Promise.all([
        AsyncStorage.getItem('regions'),
        AsyncStorage.getItem('worldStats')
      ]);

      if (regionsData) {
        const parsedRegions: Region[] = JSON.parse(regionsData);
        setRegions(parsedRegions);
        
        // Met à jour les régions dans les stats
        setWorldStats(prev => ({
          ...prev,
          regions: parsedRegions
        }));
      }

      if (statsData) {
        const parsedStats: WorldStats = JSON.parse(statsData);
        setWorldStats(prev => ({
          ...prev,
          ...parsedStats
        }));
      }

    } catch (err) {
      console.error('Erreur chargement données monde:', err);
      setError('Impossible de charger les données du monde');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Met à jour le contrôle d'une région
   */
  const updateRegionControl = async (
    regionId: string, 
    faction: FactionType, 
    points: number
  ): Promise<void> => {
    try {
      setIsLoading(true);
      
      const updatedRegions = regions.map(region => {
        if (region.id !== regionId) return region;

        const newRegion = { ...region };
        
        // Met à jour les points selon la faction
        if (faction === 'angel') {
          newRegion.angelPoints = Math.min(100, newRegion.angelPoints + points);
          newRegion.demonPoints = Math.max(0, newRegion.demonPoints - points/2);
        } else {
          newRegion.demonPoints = Math.min(100, newRegion.demonPoints + points);
          newRegion.angelPoints = Math.max(0, newRegion.angelPoints - points/2);
        }

        // Détermine la faction contrôlante
        const threshold = 10;
        if (newRegion.angelPoints > newRegion.demonPoints + threshold) {
          newRegion.controllingFaction = 'angel';
        } else if (newRegion.demonPoints > newRegion.angelPoints + threshold) {
          newRegion.controllingFaction = 'demon';
        } else {
          newRegion.controllingFaction = null;
        }

        return newRegion;
      });

      // Sauvegarde les changements
      await AsyncStorage.setItem('regions', JSON.stringify(updatedRegions));
      setRegions(updatedRegions);

      // Met à jour les stats du monde
      const updatedStats = {
        ...worldStats,
        regions: updatedRegions
      };
      
      await AsyncStorage.setItem('worldStats', JSON.stringify(updatedStats));
      setWorldStats(updatedStats);

      // Vérifie les conditions de purge
      await checkPurgeCondition();

    } catch (err) {
      console.error('Erreur mise à jour région:', err);
      setError('Impossible de mettre à jour la région');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Vérifie si une purge doit être déclenchée
   */
  const checkPurgeConditionContext = async (): Promise<boolean> => {
    try {
      const unlockedRegions = regions.filter(r => !r.isLocked);
      const angelRegions = unlockedRegions.filter(r => r.controllingFaction === 'angel').length;
      const demonRegions = unlockedRegions.filter(r => r.controllingFaction === 'demon').length;
      
      const angelPercentage = (angelRegions / unlockedRegions.length) * 100;
      const demonPercentage = (demonRegions / unlockedRegions.length) * 100;

      // Déclenche une purge si une faction contrôle 80%+ des régions
      if (angelPercentage >= 80 || demonPercentage >= 80) {
        await triggerPurge(angelPercentage > demonPercentage ? 'angel' : 'demon');
        return true;
      }

      return false;
    } catch (err) {
      console.error('Erreur vérification purge:', err);
      return false;
    }
  };

  /**
   * Déclenche une purge globale
   */
  const triggerPurge = async (winnerFaction: FactionType): Promise<void> => {
    try {
      // Réinitialise toutes les régions déverrouillées
      const resetRegions = regions.map(region => {
        if (region.isLocked) return region;
        
        return {
          ...region,
          angelPoints: 50,
          demonPoints: 50,
          controllingFaction: null as FactionType | null
        };
      });

      // Sauvegarde les régions réinitialisées
      await AsyncStorage.setItem('regions', JSON.stringify(resetRegions));
      setRegions(resetRegions);

      // Met à jour les stats de purge
      const updatedStats: WorldStats = {
        ...worldStats,
        purgeCount: worldStats.purgeCount + 1,
        currentPurgeWinner: winnerFaction,
        lastPurgeDate: new Date(),
        regions: resetRegions
      };

      await AsyncStorage.setItem('worldStats', JSON.stringify(updatedStats));
      setWorldStats(updatedStats);

      console.log(`🔥 PURGE ! Victoire des ${winnerFaction}s ! Purge #${updatedStats.purgeCount}`);
      
    } catch (err) {
      console.error('Erreur déclenchement purge:', err);
      setError('Erreur lors de la purge');
    }
  };

  /**
   * Génère un bot aléatoire
   */
  const getRandomBot = (faction?: FactionType): BotPlayer => {
    return generateRandomBot(faction);
  };

  /**
   * Met à jour les statistiques mondiales
   */
  const updateWorldStats = async (newStats: Partial<WorldStats>): Promise<void> => {
    try {
      const updatedStats = { ...worldStats, ...newStats };
      await AsyncStorage.setItem('worldStats', JSON.stringify(updatedStats));
      setWorldStats(updatedStats);
    } catch (err) {
      console.error('Erreur mise à jour stats:', err);
      setError('Impossible de mettre à jour les statistiques');
    }
  };

  /**
   * Recharge les données du monde
   */
  const refreshWorldData = async (): Promise<void> => {
    await loadWorldData();
  };

  const contextValue: GameContextValue = {
    worldStats,
    regions,
    updateRegionControl,
    checkPurgeCondition: checkPurgeConditionContext,
    getRandomBot,
    isLoading,
    error
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte du jeu
 */
export const useGameContext = (): GameContextValue => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

/**
 * Hook personnalisé pour gérer l'état global du jeu (pour App.tsx)
 */
export const useGameState = () => {
  const [worldStats, setWorldStats] = useState<WorldStats>({
    totalAngels: 0,
    totalDemons: 0,
    purgeCount: 0,
    currentPurgeWinner: null,
    lastPurgeDate: null,
    regions: [],
    activeEvents: []
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  return {
    worldStats,
    setWorldStats,
    isLoading,
    setIsLoading,
    error,
    setError
  };
};

export { GameContext };