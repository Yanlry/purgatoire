import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  Card, 
  FactionType, 
  ClassType, 
  Region, 
  WorldStats, 
  BotPlayer
} from '../types/gameTypes';

// ===== DONNÉES DES CLASSES =====

export const CLASS_BONUSES = {
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

// ===== CARTES DE BASE =====

const ANGEL_STARTER_CARDS: Omit<Card, 'id'>[] = [
  {
    name: 'Ange Gardien',
    description: 'Un protecteur céleste loyal',
    faction: 'angel',
    type: 'creature',
    rarity: 'common',
    cost: 2,
    attack: 2,
    health: 3,
    abilities: [{ name: 'Protection', description: '+1 santé aux alliés', type: 'passive', effect: 'ally_health_boost' }]
  },
  {
    name: 'Rayon Divin',
    description: 'La lumière purificatrice',
    faction: 'angel',
    type: 'spell',
    rarity: 'common',
    cost: 1,
    abilities: [{ name: 'Soin', description: 'Restaure 3 PV', type: 'active', effect: 'heal_3' }]
  },
  {
    name: 'Épée Sacrée',
    description: 'Arme bénie par les cieux',
    faction: 'angel',
    type: 'equipment',
    rarity: 'rare',
    cost: 3,
    attack: 3,
    abilities: [{ name: 'Bénédiction', description: 'Dégâts +2 contre démons', type: 'passive', effect: 'demon_damage_boost' }]
  },
  {
    name: 'Séraphin',
    description: 'Ange de haut rang',
    faction: 'angel',
    type: 'creature',
    rarity: 'epic',
    cost: 5,
    attack: 4,
    health: 5,
    abilities: [{ name: 'Vol', description: 'Ne peut pas être bloqué', type: 'passive', effect: 'unblockable' }]
  },
  {
    name: 'Guérison de Masse',
    description: 'Soigne tous les alliés',
    faction: 'angel',
    type: 'spell',
    rarity: 'rare',
    cost: 4,
    abilities: [{ name: 'Soin Global', description: 'Restaure 2 PV à tous les alliés', type: 'active', effect: 'heal_all_2' }]
  }
];

const DEMON_STARTER_CARDS: Omit<Card, 'id'>[] = [
  {
    name: 'Diablotin',
    description: 'Petit démon malicieux',
    faction: 'demon',
    type: 'creature',
    rarity: 'common',
    cost: 1,
    attack: 2,
    health: 1,
    abilities: [{ name: 'Rapidité', description: 'Peut attaquer immédiatement', type: 'passive', effect: 'haste' }]
  },
  {
    name: 'Flammes Infernales',
    description: 'Feu des abysses',
    faction: 'demon',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    abilities: [{ name: 'Brûlure', description: 'Inflige 3 dégâts', type: 'active', effect: 'damage_3' }]
  },
  {
    name: 'Griffe Démoniaque',
    description: 'Arme maudite',
    faction: 'demon',
    type: 'equipment',
    rarity: 'rare',
    cost: 3,
    attack: 3,
    abilities: [{ name: 'Corruption', description: 'Dégâts +2 contre anges', type: 'passive', effect: 'angel_damage_boost' }]
  },
  {
    name: 'Démon Majeur',
    description: 'Seigneur des enfers',
    faction: 'demon',
    type: 'creature',
    rarity: 'epic',
    cost: 6,
    attack: 6,
    health: 4,
    abilities: [{ name: 'Intimidation', description: 'Réduit l\'attaque ennemie de 1', type: 'passive', effect: 'intimidate' }]
  },
  {
    name: 'Tempête de Feu',
    description: 'Détruit tout sur son passage',
    faction: 'demon',
    type: 'spell',
    rarity: 'rare',
    cost: 5,
    abilities: [{ name: 'Destruction', description: 'Inflige 2 dégâts à tous les ennemis', type: 'active', effect: 'damage_all_2' }]
  }
];

// ===== RÉGIONS DU MONDE =====

const INITIAL_REGIONS: Region[] = [
  {
    id: 'celestial_city',
    name: 'Cité Céleste',
    description: 'Forteresse des anges dans les nuages',
    controllingFaction: 'angel',
    angelPoints: 80,
    demonPoints: 20,
    bonus: {
      name: 'Bénédiction Divine',
      description: 'Tous les anges gagnent +1 santé',
      effect: 'angel_health_boost',
      value: 1
    },
    coordinates: { x: 0.2, y: 0.1 },
    isLocked: false
  },
  {
    id: 'infernal_mountains',
    name: 'Montagnes Infernales',
    description: 'Pics volcaniques où règnent les démons',
    controllingFaction: 'demon',
    angelPoints: 15,
    demonPoints: 85,
    bonus: {
      name: 'Rage Infernale',
      description: 'Tous les démons gagnent +1 attaque',
      effect: 'demon_attack_boost',
      value: 1
    },
    coordinates: { x: 0.8, y: 0.9 },
    isLocked: false
  },
  {
    id: 'neutral_plains',
    name: 'Plaines Neutres',
    description: 'Territoire disputé entre les factions',
    controllingFaction: null,
    angelPoints: 45,
    demonPoints: 55,
    bonus: {
      name: 'Équilibre',
      description: 'Toutes les cartes coûtent 1 mana de moins',
      effect: 'mana_discount',
      value: 1
    },
    coordinates: { x: 0.5, y: 0.5 },
    isLocked: false
  },
  {
    id: 'ethereal_forest',
    name: 'Forêt Éthérée',
    description: 'Bois mystique aux énergies changeantes',
    controllingFaction: 'angel',
    angelPoints: 60,
    demonPoints: 40,
    bonus: {
      name: 'Croissance Magique',
      description: 'Piochez une carte supplémentaire par tour',
      effect: 'extra_draw',
      value: 1
    },
    coordinates: { x: 0.3, y: 0.7 },
    isLocked: false
  },
  {
    id: 'cursed_wasteland',
    name: 'Terres Maudites',
    description: 'Désert corrompu par la magie noire',
    controllingFaction: 'demon',
    angelPoints: 25,
    demonPoints: 75,
    bonus: {
      name: 'Malédiction',
      description: 'Les sorts infligent +1 dégât',
      effect: 'spell_damage_boost',
      value: 1
    },
    coordinates: { x: 0.7, y: 0.3 },
    isLocked: false
  },
  {
    id: 'ancient_ruins',
    name: 'Ruines Anciennes',
    description: 'Vestiges d\'une civilisation oubliée',
    controllingFaction: null,
    angelPoints: 50,
    demonPoints: 50,
    bonus: {
      name: 'Savoir Ancien',
      description: 'Gagnez +50% d\'expérience',
      effect: 'experience_boost',
      value: 50
    },
    coordinates: { x: 0.6, y: 0.2 },
    isLocked: true
  }
];

// ===== FONCTIONS PRINCIPALES =====

/**
 * Initialise les données du jeu
 */
export const initializeGameData = async (): Promise<void> => {
  try {
    // Vérifie si les données existent déjà
    const existingData = await AsyncStorage.getItem('gameInitialized');
    
    if (!existingData) {
      // Initialise les régions
      await AsyncStorage.setItem('regions', JSON.stringify(INITIAL_REGIONS));
      
      // Initialise les stats du monde
      const initialWorldStats: WorldStats = {
        totalAngels: 0,
        totalDemons: 0,
        purgeCount: 0,
        currentPurgeWinner: null,
        lastPurgeDate: null,
        regions: INITIAL_REGIONS,
        activeEvents: []
      };
      
      await AsyncStorage.setItem('worldStats', JSON.stringify(initialWorldStats));
      await AsyncStorage.setItem('gameInitialized', 'true');
    }
  } catch (error) {
    console.error('Erreur initialisation données:', error);
    throw error;
  }
};

/**
 * Crée un deck de démarrage selon la faction et classe
 */
export const createStarterDeck = (faction: FactionType, playerClass: ClassType): Card[] => {
  const baseCards = faction === 'angel' ? ANGEL_STARTER_CARDS : DEMON_STARTER_CARDS;
  
  // Ajoute des cartes spécifiques à la classe
  const classCards = getClassSpecificCards(faction, playerClass);
  
  const allCards = [...baseCards, ...classCards];
  
  // Génère des IDs uniques et duplique certaines cartes
  const deck: Card[] = [];
  
  allCards.forEach((cardTemplate, index) => {
    // Ajoute 2-3 copies selon la rareté
    const copies = cardTemplate.rarity === 'common' ? 3 : 
                   cardTemplate.rarity === 'rare' ? 2 : 1;
    
    for (let i = 0; i < copies; i++) {
      deck.push({
        ...cardTemplate,
        id: `${faction}_${playerClass}_${index}_${i}_${Date.now()}`
      });
    }
  });
  
  return deck.slice(0, 20); // Limite à 20 cartes pour le starter
};

/**
 * Génère des cartes spécifiques à une classe
 */
const getClassSpecificCards = (faction: FactionType, playerClass: ClassType): Omit<Card, 'id'>[] => {
  // Utilisation d'une assertion de type pour éviter l'erreur TypeScript
  const classData = (CLASS_BONUSES as any)[playerClass];
  
  const classCard: Omit<Card, 'id'> = {
    name: `${classData.name} Spécial`,
    description: classData.specialAbility,
    faction,
    type: 'spell',
    rarity: 'rare',
    cost: 2,
    abilities: [{
      name: classData.name,
      description: classData.specialAbility,
      type: 'active',
      effect: `class_${playerClass}`
    }]
  };
  
  return [classCard];
};

/**
 * Génère un bot ennemi aléatoire
 */
export const generateRandomBot = (opponentFaction?: FactionType): BotPlayer => {
  const faction = opponentFaction || (Math.random() > 0.5 ? 'angel' : 'demon');
  const classes: ClassType[] = ['mage', 'warrior', 'paladin', 'necromancer', 'shaman'];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  
  const botNames = faction === 'angel' 
    ? ['Gabriel', 'Michael', 'Raphael', 'Uriel', 'Zadkiel']
    : ['Baal', 'Malphas', 'Belial', 'Asmodeus', 'Valefor'];
  
  return {
    id: `bot_${Date.now()}`,
    username: botNames[Math.floor(Math.random() * botNames.length)],
    faction,
    class: randomClass,
    level: Math.floor(Math.random() * 10) + 1,
    deck: createStarterDeck(faction, randomClass),
    isBot: true
  };
};

/**
 * Met à jour le contrôle d'une région
 */
export const updateRegionControl = async (
  regionId: string, 
  winnerFaction: FactionType, 
  points: number = 10
): Promise<void> => {
  try {
    const regionsData = await AsyncStorage.getItem('regions');
    if (!regionsData) return;
    
    const regions: Region[] = JSON.parse(regionsData);
    const regionIndex = regions.findIndex(r => r.id === regionId);
    
    if (regionIndex === -1) return;
    
    const region = regions[regionIndex];
    
    // Met à jour les points selon la faction gagnante
    if (winnerFaction === 'angel') {
      region.angelPoints = Math.min(100, region.angelPoints + points);
      region.demonPoints = Math.max(0, region.demonPoints - points/2);
    } else {
      region.demonPoints = Math.min(100, region.demonPoints + points);
      region.angelPoints = Math.max(0, region.angelPoints - points/2);
    }
    
    // Détermine la faction contrôlante
    if (region.angelPoints > region.demonPoints + 10) {
      region.controllingFaction = 'angel';
    } else if (region.demonPoints > region.angelPoints + 10) {
      region.controllingFaction = 'demon';
    } else {
      region.controllingFaction = null;
    }
    
    regions[regionIndex] = region;
    await AsyncStorage.setItem('regions', JSON.stringify(regions));
    
    // Vérifie les conditions de purge
    await checkPurgeCondition();
    
  } catch (error) {
    console.error('Erreur mise à jour région:', error);
  }
};

/**
 * Vérifie si une purge doit être déclenchée
 */
export const checkPurgeCondition = async (): Promise<boolean> => {
  try {
    const regionsData = await AsyncStorage.getItem('regions');
    if (!regionsData) return false;
    
    const regions: Region[] = JSON.parse(regionsData);
    
    const angelRegions = regions.filter(r => r.controllingFaction === 'angel').length;
    const demonRegions = regions.filter(r => r.controllingFaction === 'demon').length;
    const totalRegions = regions.filter(r => !r.isLocked).length;
    
    // Purge si une faction contrôle 80%+ des régions
    const angelPercentage = (angelRegions / totalRegions) * 100;
    const demonPercentage = (demonRegions / totalRegions) * 100;
    
    if (angelPercentage >= 80 || demonPercentage >= 80) {
      await triggerPurge(angelPercentage > demonPercentage ? 'angel' : 'demon');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur vérification purge:', error);
    return false;
  }
};

/**
 * Déclenche une purge du monde
 */
const triggerPurge = async (winnerFaction: FactionType): Promise<void> => {
  try {
    // Réinitialise toutes les régions
    const resetRegions = INITIAL_REGIONS.map(region => ({
      ...region,
      angelPoints: 50,
      demonPoints: 50,
      controllingFaction: null as FactionType | null
    }));
    
    await AsyncStorage.setItem('regions', JSON.stringify(resetRegions));
    
    // Met à jour les stats du monde
    const worldStatsData = await AsyncStorage.getItem('worldStats');
    if (worldStatsData) {
      const worldStats: WorldStats = JSON.parse(worldStatsData);
      worldStats.purgeCount += 1;
      worldStats.currentPurgeWinner = winnerFaction;
      worldStats.lastPurgeDate = new Date();
      
      await AsyncStorage.setItem('worldStats', JSON.stringify(worldStats));
    }
    
    console.log(`🔥 PURGE DÉCLENCHÉE ! Victoire des ${winnerFaction}s !`);
  } catch (error) {
    console.error('Erreur déclenchement purge:', error);
  }
};