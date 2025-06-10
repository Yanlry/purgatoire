// ===== TYPES FONDAMENTAUX =====

export type FactionType = 'angel' | 'demon';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CardType = 'creature' | 'spell' | 'equipment';
export type ClassType = 'mage' | 'warrior' | 'paladin' | 'necromancer' | 'shaman';

// ===== INTERFACE CARTE =====

export interface Card {
  id: string;
  name: string;
  description: string;
  faction: FactionType;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  attack?: number;
  health?: number;
  image?: string;
  abilities?: CardAbility[];
}

export interface CardAbility {
  name: string;
  description: string;
  type: 'passive' | 'active' | 'triggered';
  effect: string;
}

// ===== INTERFACE JOUEUR =====

export interface Player {
  id: string;
  username: string;
  faction: FactionType;
  class: ClassType;
  level: number;
  experience: number;
  wins: number;
  losses: number;
  deck: Card[];
  collection: Card[];
  reputation: number;
  isConverted: boolean;
  createdAt: Date;
}

// ===== INTERFACE RÉGION =====

export interface Region {
  id: string;
  name: string;
  description: string;
  controllingFaction: FactionType | null;
  angelPoints: number;
  demonPoints: number;
  bonus: RegionBonus;
  coordinates: { x: number; y: number };
  isLocked: boolean;
}

export interface RegionBonus {
  name: string;
  description: string;
  effect: string;
  value: number;
}

// ===== INTERFACE COMBAT =====

export interface Battle {
  id: string;
  player1: Player;
  player2: Player | BotPlayer;
  winner: Player | BotPlayer | null;
  region: Region;
  turns: BattleTurn[];
  status: 'waiting' | 'active' | 'finished';
  playerHealth: number;
  opponentHealth: number;
  createdAt: Date;
}

export interface BotPlayer {
  id: string;
  username: string;
  faction: FactionType;
  class: ClassType;
  level: number;
  deck: Card[];
  isBot: true;
}

export interface BattleTurn {
  playerId: string;
  action: BattleAction;
  cardUsed?: Card;
  damage?: number;
  healing?: number;
  timestamp: Date;
}

export interface BattleAction {
  type: 'play_card' | 'attack' | 'pass' | 'surrender';
  targetId?: string;
  cardId?: string;
}

// ===== STATISTIQUES GLOBALES =====

export interface WorldStats {
  totalAngels: number;
  totalDemons: number;
  purgeCount: number;
  currentPurgeWinner: FactionType | null;
  lastPurgeDate: Date | null;
  regions: Region[];
  activeEvents: WorldEvent[];
}

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  type: 'bonus' | 'penalty' | 'special';
  affectedRegions: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// ===== CONSTANTES ET COULEURS =====

export const FACTION_COLORS = {
  angel: {
    primary: '#FFD700',
    secondary: '#87CEEB',
    background: '#F0F8FF',
    dark: '#4169E1'
  },
  demon: {
    primary: '#DC143C',
    secondary: '#8B0000',
    background: '#2F1B14',
    dark: '#650000'
  }
} as const;

export const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B'
} as const;

export const CARD_TYPE_COLORS = {
  creature: '#10B981',
  spell: '#8B5CF6',
  equipment: '#F59E0B'
} as const;

// ===== CONSTANTES DE JEU =====

export const GAME_CONSTANTS = {
  MAX_DECK_SIZE: 30,
  MIN_DECK_SIZE: 20,
  MAX_HAND_SIZE: 7,
  PURGE_THRESHOLD: 100,
  STARTING_HEALTH: 30,
  MAX_MANA: 10,
  CARDS_PER_TURN: 1,
  EXPERIENCE_PER_WIN: 100,
  EXPERIENCE_PER_LOSS: 25,
} as const;

// ===== INTERFACES DE COMPOSANTS =====

export interface ScreenProps {
  player: Player | null;
  setPlayer: (player: Player) => Promise<void>;
  navigateToScreen: (screen: ScreenType) => void;
}

export interface FactionSelectionProps extends ScreenProps {
  onPlayerCreated: (username: string, faction: FactionType, playerClass: ClassType) => Promise<void>;
}

export type ScreenType = 'home' | 'factionSelection' | 'worldMap' | 'deck' | 'battle' | 'profile';

// ===== INTERFACE CONTEXTE JEU =====

export interface GameContextValue {
  worldStats: WorldStats;
  regions: Region[];
  updateRegionControl: (regionId: string, faction: FactionType, points: number) => Promise<void>;
  checkPurgeCondition: () => Promise<boolean>;
  getRandomBot: (faction?: FactionType) => BotPlayer;
  isLoading: boolean;
  error: string | null;
}

// ===== DONNÉES STARTER =====

export interface StarterDeckConfig {
  faction: FactionType;
  class: ClassType;
  cards: Omit<Card, 'id'>[];
}

// ===== INTERFACES DE CLASSE CORRIGÉES =====

export interface ClassBonus {
  name: string;
  description: string;
  healthBonus: number;
  manaBonus: number;
  specialAbility: string;
}

// Type pour les bonus de classe utilisant Record au lieu d'un type mappé
export type ClassBonuses = Record<ClassType, ClassBonus>;