import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { 
  ScreenProps, 
  Card, 
  BotPlayer, 
  FactionType 
} from '../types/gameTypes';
import { 
  FACTION_COLORS, 
  RARITY_COLORS, 
  CARD_TYPE_COLORS,
  GAME_CONSTANTS 
} from '../types/gameTypes';
import { generateRandomBot, updateRegionControl } from '../services/gameService';

const { width, height } = Dimensions.get('window');

// ===== INTERFACES & TYPES =====

interface BattleState {
  playerHealth: number;
  opponentHealth: number;
  playerMana: number;
  opponentMana: number;
  playerHand: Card[];
  opponentHand: Card[];
  playerDeck: Card[];
  opponentDeck: Card[];
  playerGraveyard: Card[];
  opponentGraveyard: Card[];
  turn: 'player' | 'opponent';
  turnNumber: number;
  selectedCard: Card | null;
  battleLog: string[];
  isGameOver: boolean;
  winner: 'player' | 'opponent' | null;
}

interface AnimationRefs {
  cardPlay: Animated.Value;
  cardPlayScale: Animated.Value;
  healthBars: Animated.Value;
  manaOrbs: Animated.Value;
  battleEffects: Animated.Value;
  battleEffectsOpacity: Animated.Value;
  turnTransition: Animated.Value;
}

// ===== PLAYER PORTRAIT COMPONENT =====

interface PlayerPortraitProps {
  player: { username: string; faction: FactionType };
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  isOpponent?: boolean;
  isCurrentTurn: boolean;
}

const PlayerPortrait: React.FC<PlayerPortraitProps> = ({
  player,
  health,
  maxHealth,
  mana,
  maxMana,
  isOpponent = false,
  isCurrentTurn
}) => {
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const healthPercentage = (health / maxHealth) * 100;
  const manaPercentage = (mana / maxMana) * 100;

  useEffect(() => {
    if (isCurrentTurn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowOpacity.setValue(0);
    }
  }, [isCurrentTurn]);

  const factionIcon = player.faction === 'angel' ? '👼' : '😈';
  const factionColors = FACTION_COLORS[player.faction];

  return (
    <Animated.View style={[
      styles.playerPortrait,
      isOpponent && styles.opponentPortrait,
      {
        shadowColor: isCurrentTurn ? factionColors.primary : 'transparent',
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: isCurrentTurn ? 20 : 5,
      }
    ]}>
      <LinearGradient
        colors={[
          factionColors.primary + '40',
          factionColors.secondary + '20',
          '#1a1a2e'
        ]}
        style={styles.portraitGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Avatar Circle */}
        <View style={[styles.avatarContainer, { borderColor: factionColors.primary }]}>
          <LinearGradient
            colors={[factionColors.primary, factionColors.secondary]}
            style={styles.avatarGradient}
          >
            <Text style={styles.factionIcon}>{factionIcon}</Text>
          </LinearGradient>
          {isCurrentTurn && (
            <Animated.View style={[
              styles.avatarGlow,
              {
                backgroundColor: factionColors.primary,
                opacity: glowOpacity
              }
            ]} />
          )}
        </View>

        <View style={styles.playerInfo}>
          <Text style={[
            styles.playerNameEpic,
            isOpponent && styles.opponentName
          ]}>{player.username}</Text>
          
          {/* Health Bar Epic */}
          <View style={styles.epicStatContainer}>
            <View style={styles.epicStatBar}>
              <LinearGradient
                colors={isOpponent ? ['#ff6666', '#ff4444', '#ff2222'] : ['#ff4444', '#ff6666', '#ff8888']}
                style={[styles.epicStatFill, { width: `${healthPercentage}%` }]}
              />
              <Text style={styles.epicStatText}>{health}</Text>
            </View>
            <Text style={styles.epicStatLabel}>❤️ VIE</Text>
          </View>

          {/* Mana Bar Epic */}
          <View style={styles.epicStatContainer}>
            <View style={styles.epicStatBar}>
              <LinearGradient
                colors={isOpponent ? ['#6666ff', '#4444ff', '#2222ff'] : ['#4444ff', '#6666ff', '#8888ff']}
                style={[styles.epicStatFill, { width: `${manaPercentage}%` }]}
              />
              <Text style={styles.epicStatText}>{mana}</Text>
            </View>
            <Text style={styles.epicStatLabel}>💎 MANA</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ===== EPIC CARD COMPONENT =====

interface EpicCardProps {
  card: Card;
  onPlay: (card: Card) => void;
  canPlay: boolean;
  isSelected?: boolean;
}

const EpicCard: React.FC<EpicCardProps> = ({ card, onPlay, canPlay, isSelected = false }) => {
  const hoverAnimation = useRef(new Animated.Value(0)).current;
  const rarityOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rarityOpacity, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(rarityOpacity, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(hoverAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(hoverAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 7,
    }).start();
  };

  const rarityGlow = RARITY_COLORS[card.rarity];
  const typeColor = CARD_TYPE_COLORS[card.type];

  return (
    <Animated.View style={[
      styles.epicCardContainer,
      {
        transform: [
          {
            scale: hoverAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.05]
            })
          },
          {
            translateY: hoverAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -10]
            })
          }
        ],
        shadowColor: rarityGlow,
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
      }
    ]}>
      <TouchableOpacity
        style={[
          styles.epicCard,
          !canPlay && styles.disabledCard,
          isSelected && styles.selectedCard
        ]}
        onPress={() => onPlay(card)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!canPlay}
        activeOpacity={0.9}
      >
        {/* Card Background with Rarity Border */}
        <LinearGradient
          colors={[
            typeColor + '80',
            typeColor + '40',
            '#2a2a3e'
          ]}
          style={styles.epicCardBackground}
        >
          {/* Rarity Border Effect */}
          <Animated.View style={[
            styles.rarityBorder,
            {
              borderColor: rarityGlow,
              borderWidth: 2,
              opacity: rarityOpacity
            }
          ]} />

          {/* Card Header */}
          <View style={styles.epicCardHeader}>
            <View style={[styles.costOrb, { backgroundColor: typeColor }]}>
              <Text style={styles.costText}>{card.cost}</Text>
            </View>
            <View style={styles.rarityGem}>
              <Text style={styles.rarityIcon}>
                {card.rarity === 'legendary' ? '⭐' : 
                 card.rarity === 'epic' ? '💎' : 
                 card.rarity === 'rare' ? '🔹' : '⚪'}
              </Text>
            </View>
          </View>

          {/* Card Art Area */}
          <View style={styles.cardArtArea}>
            <LinearGradient
              colors={[typeColor + '60', typeColor + '20']}
              style={styles.cardArtGradient}
            >
              <Text style={styles.cardTypeIcon}>
                {card.type === 'creature' ? '⚔️' : 
                 card.type === 'spell' ? '✨' : '🛡️'}
              </Text>
            </LinearGradient>
          </View>

          {/* Card Info */}
          <View style={styles.epicCardInfo}>
            <Text style={styles.epicCardName}>{card.name}</Text>
            <Text style={styles.epicCardType}>{card.type.toUpperCase()}</Text>
            
            {/* Stats */}
            {card.attack !== undefined && (
              <View style={styles.epicCardStats}>
                <View style={styles.statContainer}>
                  <Text style={styles.statValue}>{card.attack}</Text>
                  <Text style={styles.statLabel}>ATQ</Text>
                </View>
                {card.health && (
                  <View style={styles.statContainer}>
                    <Text style={styles.statValue}>{card.health}</Text>
                    <Text style={styles.statLabel}>VIE</Text>
                  </View>
                )}
              </View>
            )}
            
            <Text style={styles.epicCardDescription}>{card.description}</Text>
          </View>

          {/* Disabled Overlay */}
          {!canPlay && (
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>MANA INSUFFISANT</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ===== BATTLE LOG COMPONENT =====

interface BattleLogProps {
  logs: string[];
}

const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [logs]);

  return (
    <View style={styles.battleLogContainer}>
      <LinearGradient
        colors={['#1a1a2e80', '#16213e60', '#0f346040']}
        style={styles.battleLogGradient}
      >
        <Text style={styles.battleLogTitle}>📜 JOURNAL DE COMBAT</Text>
        <ScrollView 
          ref={scrollRef}
          style={styles.battleLogScroll}
          showsVerticalScrollIndicator={false}
        >
          {logs.map((log, index) => (
            <Text key={index} style={[
              styles.battleLogText,
              log.includes('recyclé') && styles.recycleLog,
              log.includes('Tour') && styles.turnLog,
              log.includes('🎉') && styles.victoryLog,
              log.includes('💀') && styles.defeatLog,
            ]}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

// ===== MAIN BATTLE SCREEN COMPONENT =====

/**
 * Epic Battle Screen with AAA game quality visuals
 * Features cinematic effects, professional UI, and immersive experience
 */
const EpicBattleScreen: React.FC<ScreenProps> = ({
  player,
  setPlayer,
  navigateToScreen,
}) => {
  const [opponent] = useState<BotPlayer>(() => 
    generateRandomBot(player?.faction === 'angel' ? 'demon' : 'angel')
  );
  
  const [battleState, setBattleState] = useState<BattleState>(() => {
    if (!player) {
      return {} as BattleState;
    }
    
    const shuffledPlayerDeck = [...player.deck].sort(() => Math.random() - 0.5);
    const shuffledOpponentDeck = [...opponent.deck].sort(() => Math.random() - 0.5);
    
    return {
      playerHealth: GAME_CONSTANTS.STARTING_HEALTH,
      opponentHealth: GAME_CONSTANTS.STARTING_HEALTH,
      playerMana: 1,
      opponentMana: 1,
      playerHand: shuffledPlayerDeck.slice(0, 4),
      opponentHand: shuffledOpponentDeck.slice(0, 4),
      playerDeck: shuffledPlayerDeck.slice(4),
      opponentDeck: shuffledOpponentDeck.slice(4),
      playerGraveyard: [],
      opponentGraveyard: [],
      turn: 'player',
      turnNumber: 1,
      selectedCard: null,
      battleLog: [
        `⚡ LE COMBAT ÉPIQUE COMMENCE !`,
        `${player.username} affronte ${opponent.username}`,
        `Que les cieux tremblent et que les enfers grondent...`
      ],
      isGameOver: false,
      winner: null,
    };
  });

  // Animation references
  const animations: AnimationRefs = {
    cardPlay: useRef(new Animated.Value(1)).current,
    cardPlayScale: useRef(new Animated.Value(1)).current,
    healthBars: useRef(new Animated.Value(1)).current,
    manaOrbs: useRef(new Animated.Value(0)).current,
    battleEffects: useRef(new Animated.Value(0)).current,
    battleEffectsOpacity: useRef(new Animated.Value(0)).current,
    turnTransition: useRef(new Animated.Value(0)).current,
  };

  // ===== GAME LOGIC (Same as original but with epic animations) =====

  const recycleDeck = (deck: Card[], graveyard: Card[]): { newDeck: Card[], newGraveyard: Card[] } => {
    if (deck.length > 0) {
      return { newDeck: deck, newGraveyard: graveyard };
    }
    
    if (graveyard.length === 0) {
      return { newDeck: [], newGraveyard: [] };
    }
    
    const shuffledCards = [...graveyard].sort(() => Math.random() - 0.5);
    
    return {
      newDeck: shuffledCards,
      newGraveyard: []
    };
  };

  const drawCard = (hand: Card[], deck: Card[], graveyard: Card[]): {
    newHand: Card[];
    newDeck: Card[];
    newGraveyard: Card[];
    drawnCard: Card | null;
    recycled: boolean;
  } => {
    if (hand.length >= GAME_CONSTANTS.MAX_HAND_SIZE) {
      return { newHand: hand, newDeck: deck, newGraveyard: graveyard, drawnCard: null, recycled: false };
    }
    
    let currentDeck = [...deck];
    let currentGraveyard = [...graveyard];
    let recycled = false;
    
    if (currentDeck.length === 0 && currentGraveyard.length > 0) {
      const recycleResult = recycleDeck(currentDeck, currentGraveyard);
      currentDeck = recycleResult.newDeck;
      currentGraveyard = recycleResult.newGraveyard;
      recycled = true;
    }
    
    if (currentDeck.length === 0) {
      return { newHand: hand, newDeck: currentDeck, newGraveyard: currentGraveyard, drawnCard: null, recycled };
    }
    
    const drawnCard = currentDeck[0];
    const newHand = [...hand, drawnCard];
    const newDeck = currentDeck.slice(1);
    
    return { newHand, newDeck, newGraveyard: currentGraveyard, drawnCard, recycled };
  };

  const applyCardEffect = (card: Card, caster: 'player' | 'opponent', state: BattleState) => {
    let damage = 0;
    let healing = 0;
    let message = `${caster === 'player' ? player?.username : opponent.username} invoque ${card.name}`;

    switch (card.type) {
      case 'creature':
        damage = card.attack || 0;
        message += ` qui attaque pour ${damage} dégâts ! ⚔️`;
        break;
      case 'spell':
        if (card.abilities && card.abilities.length > 0) {
          const ability = card.abilities[0];
          if (ability.effect.includes('damage')) {
            damage = parseInt(ability.effect.split('_')[1]) || 3;
            message += ` et déchaîne ${damage} dégâts magiques ! ✨`;
          } else if (ability.effect.includes('heal')) {
            healing = parseInt(ability.effect.split('_')[1]) || 3;
            message += ` et restaure ${healing} points de vie ! 💚`;
          }
        }
        break;
      case 'equipment':
        damage = card.attack || 0;
        message += ` et brandit une arme légendaire (+${damage} ATQ) ! 🗡️`;
        break;
    }

    return { damage, healing, message };
  };

  const playCard = (card: Card): void => {
    if (battleState.turn !== 'player' || battleState.isGameOver) return;
    if (card.cost > battleState.playerMana) {
      Alert.alert('⚡ Mana Insuffisant', `Cette carte nécessite ${card.cost} mana.`);
      return;
    }

    // Epic card play animation
    Animated.sequence([
      Animated.timing(animations.cardPlayScale, { toValue: 1.3, duration: 200, useNativeDriver: true }),
      Animated.timing(animations.battleEffectsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(animations.cardPlayScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(animations.battleEffectsOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    const newState = { ...battleState };
    
    newState.playerHand = newState.playerHand.filter(c => c.id !== card.id);
    newState.playerMana -= card.cost;
    newState.playerGraveyard.push(card);

    const effect = applyCardEffect(card, 'player', newState);
    newState.battleLog.push(effect.message);
    
    if (effect.damage > 0) {
      newState.opponentHealth = Math.max(0, newState.opponentHealth - effect.damage);
    }
    if (effect.healing > 0) {
      newState.playerHealth = Math.min(GAME_CONSTANTS.STARTING_HEALTH, newState.playerHealth + effect.healing);
    }

    if (newState.opponentHealth <= 0) {
      newState.isGameOver = true;
      newState.winner = 'player';
      newState.battleLog.push(`🏆 VICTOIRE ÉPIQUE ! ${player?.username} triomphe !`);
    } else {
      setTimeout(() => opponentTurn(newState), 1500);
    }

    setBattleState(newState);
  };

  const opponentTurn = (currentState: BattleState): void => {
    const newState = { ...currentState };
    
    const playableCards = newState.opponentHand.filter(card => card.cost <= newState.opponentMana);
    
    if (playableCards.length > 0) {
      const cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
      
      newState.opponentHand = newState.opponentHand.filter(c => c.id !== cardToPlay.id);
      newState.opponentMana -= cardToPlay.cost;
      newState.opponentGraveyard.push(cardToPlay);

      const effect = applyCardEffect(cardToPlay, 'opponent', newState);
      newState.battleLog.push(effect.message);
      
      if (effect.damage > 0) {
        newState.playerHealth = Math.max(0, newState.playerHealth - effect.damage);
      }
      if (effect.healing > 0) {
        newState.opponentHealth = Math.min(GAME_CONSTANTS.STARTING_HEALTH, newState.opponentHealth + effect.healing);
      }
    }

    if (newState.playerHealth <= 0) {
      newState.isGameOver = true;
      newState.winner = 'opponent';
      newState.battleLog.push(`💀 DÉFAITE ! ${opponent.username} règne en maître !`);
    } else {
      newState.turn = 'player';
      newState.turnNumber += 1;
      newState.playerMana = Math.min(GAME_CONSTANTS.MAX_MANA, newState.turnNumber);
      newState.opponentMana = Math.min(GAME_CONSTANTS.MAX_MANA, newState.turnNumber);
      
      const playerDraw = drawCard(newState.playerHand, newState.playerDeck, newState.playerGraveyard);
      newState.playerHand = playerDraw.newHand;
      newState.playerDeck = playerDraw.newDeck;
      newState.playerGraveyard = playerDraw.newGraveyard;
      
      const opponentDraw = drawCard(newState.opponentHand, newState.opponentDeck, newState.opponentGraveyard);
      newState.opponentHand = opponentDraw.newHand;
      newState.opponentDeck = opponentDraw.newDeck;
      newState.opponentGraveyard = opponentDraw.newGraveyard;
      
      if (playerDraw.recycled) {
        newState.battleLog.push(`⚡ Vos cartes renaissent de leurs cendres ! (${newState.playerDeck.length} cartes)`);
      }
      if (opponentDraw.recycled) {
        newState.battleLog.push(`🔄 Le deck adverse se régénère !`);
      }
      
      newState.battleLog.push(`--- ⚔️ TOUR ${newState.turnNumber} ⚔️ ---`);
    }

    setBattleState(newState);
  };

  const passTurn = (): void => {
    if (battleState.turn !== 'player' || battleState.isGameOver) return;
    
    const newState = { ...battleState };
    newState.battleLog.push(`⏭️ ${player?.username} passe son tour et médite...`);
    setTimeout(() => opponentTurn(newState), 1000);
  };

  const surrender = (): void => {
    Alert.alert(
      '🏳️ Reddition',
      'Abandonner ce combat épique ?',
      [
        { text: 'Continuer le combat', style: 'cancel' },
        { 
          text: 'Se rendre', 
          style: 'destructive',
          onPress: () => {
            const newState = { ...battleState };
            newState.isGameOver = true;
            newState.winner = 'opponent';
            newState.battleLog.push(`🏳️ ${player?.username} se rend avec honneur.`);
            setBattleState(newState);
          }
        }
      ]
    );
  };

  // Handle game over
  useEffect(() => {
    if (battleState.isGameOver && battleState.winner && player) {
      const handleGameOver = async () => {
        const playerWon = battleState.winner === 'player';
        const experienceGained = playerWon ? GAME_CONSTANTS.EXPERIENCE_PER_WIN : GAME_CONSTANTS.EXPERIENCE_PER_LOSS;
        
        const updatedPlayer = {
          ...player,
          experience: player.experience + experienceGained,
          wins: playerWon ? player.wins + 1 : player.wins,
          losses: playerWon ? player.losses : player.losses + 1,
        };

        const newLevel = Math.floor(updatedPlayer.experience / 1000) + 1;
        if (newLevel > updatedPlayer.level) {
          updatedPlayer.level = newLevel;
          Alert.alert('🌟 ASCENSION !', `Vous atteignez le niveau ${newLevel} !`);
        }

        await setPlayer(updatedPlayer);

        if (playerWon) {
          await updateRegionControl('neutral_plains', player.faction, 15);
        }

        Alert.alert(
          playerWon ? '🏆 GLOIRE ÉTERNELLE !' : '⚰️ DÉFAITE HÉROÏQUE',
          `${playerWon ? 'Victoire éclatante contre' : 'Vaillante défaite face à'} ${opponent.username}\n\n` +
          `💫 Expérience: +${experienceGained}\n` +
          `⭐ Niveau: ${updatedPlayer.level}\n\n` +
          `📊 Statistiques épiques:\n` +
          `• Tours de gloire: ${battleState.turnNumber}\n` +
          `• Sorts invoqués: ${battleState.playerGraveyard.length}\n` +
          `• Résurrections: ${battleState.battleLog.filter(log => log.includes('recyclé')).length}`,
          [
            { text: 'Retour aux terres', onPress: () => navigateToScreen('worldMap') }
          ]
        );
      };

      handleGameOver();
    }
  }, [battleState.isGameOver, battleState.winner]);

  if (!player) {
    return (
      <LinearGradient colors={['#1a1a2e', '#000']} style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ Erreur: Héros introuvable</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.epicContainer}>
      {/* Epic Background */}
      <LinearGradient
        colors={[
          '#0a0a1f',
          '#1a1a2e',
          '#2d1b42',
          '#1a1a2e',
          '#0a0a1f'
        ]}
        style={styles.backgroundGradient}
      >
        {/* Animated Battle Effects */}
        <Animated.View style={[
          styles.battleEffectsOverlay,
          {
            opacity: animations.battleEffectsOpacity,
            transform: [{ scale: animations.battleEffectsOpacity }]
          }
        ]}>
          <LinearGradient
            colors={['#ff444440', '#44ff4440', '#4444ff40']}
            style={styles.battleEffectsGradient}
          />
        </Animated.View>

        {/* Player Portraits */}
        <View style={styles.portraitsContainer}>
          <PlayerPortrait
            player={player}
            health={battleState.playerHealth}
            maxHealth={GAME_CONSTANTS.STARTING_HEALTH}
            mana={battleState.playerMana}
            maxMana={Math.min(GAME_CONSTANTS.MAX_MANA, battleState.turnNumber)}
            isCurrentTurn={battleState.turn === 'player'}
          />

          {/* Turn Indicator */}
          <View style={styles.epicTurnIndicator}>
            <LinearGradient
              colors={['#ffd700', '#ffed4e', '#ffd700']}
              style={styles.turnIndicatorGradient}
            >
              <Text style={styles.epicTurnText}>TOUR {battleState.turnNumber}</Text>
              <Text style={styles.epicCurrentTurn}>
                {battleState.turn === 'player' ? '⚔️ VOTRE TOUR' : '🛡️ TOUR ADVERSAIRE'}
              </Text>
              {battleState.isGameOver && (
                <Text style={styles.epicGameOver}>
                  {battleState.winner === 'player' ? '🏆 VICTOIRE' : '💀 DÉFAITE'}
                </Text>
              )}
            </LinearGradient>
          </View>

          <PlayerPortrait
            player={opponent}
            health={battleState.opponentHealth}
            maxHealth={GAME_CONSTANTS.STARTING_HEALTH}
            mana={battleState.opponentMana}
            maxMana={Math.min(GAME_CONSTANTS.MAX_MANA, battleState.turnNumber)}
            isOpponent={true}
            isCurrentTurn={battleState.turn === 'opponent'}
          />
        </View>

        {/* Main Battle Area */}
        <View style={styles.epicGameArea}>
          
          {/* Opponent Hidden Hand */}
          <View style={styles.opponentHandContainer}>
            {battleState.opponentHand.map((_, index) => (
              <View key={index} style={styles.epicHiddenCard}>
                <LinearGradient
                  colors={['#2a2a3e', '#1a1a2e']}
                  style={styles.hiddenCardGradient}
                >
                  <Text style={styles.hiddenCardIcon}>🂠</Text>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Battle Log */}
          <BattleLog logs={battleState.battleLog} />

          {/* Player Hand */}
          <View style={styles.playerHandContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playerHandContent}
            >
              {battleState.playerHand.length === 0 ? (
                <View style={styles.emptyHandEpic}>
                  <LinearGradient
                    colors={['#2a2a3e40', '#1a1a2e60']}
                    style={styles.emptyHandGradient}
                  >
                    <Text style={styles.emptyHandTextEpic}>
                      {battleState.playerDeck.length === 0 && battleState.playerGraveyard.length === 0 
                        ? '🎭 ARSENAL ÉPUISÉ' 
                        : '🔄 PASSEZ POUR PIOCHER'
                      }
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                battleState.playerHand.map((card) => (
                  <EpicCard
                    key={card.id}
                    card={card}
                    onPlay={playCard}
                    canPlay={card.cost <= battleState.playerMana && battleState.turn === 'player' && !battleState.isGameOver}
                    isSelected={battleState.selectedCard?.id === card.id}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Epic Action Buttons */}
        <View style={styles.epicActionBar}>
          <TouchableOpacity
            style={[
              styles.epicButton,
              styles.passButton,
              (battleState.turn !== 'player' || battleState.isGameOver) && styles.disabledEpicButton
            ]}
            onPress={passTurn}
            disabled={battleState.turn !== 'player' || battleState.isGameOver}
          >
            <LinearGradient
              colors={battleState.turn === 'player' && !battleState.isGameOver ? ['#4CAF50', '#45a049'] : ['#666', '#555']}
              style={styles.epicButtonGradient}
            >
              <Text style={styles.epicButtonText}>⏭️ PASSER</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.epicButton,
              styles.surrenderButton,
              battleState.isGameOver && styles.disabledEpicButton
            ]}
            onPress={surrender}
            disabled={battleState.isGameOver}
          >
            <LinearGradient
              colors={!battleState.isGameOver ? ['#f44336', '#d32f2f'] : ['#666', '#555']}
              style={styles.epicButtonGradient}
            >
              <Text style={styles.epicButtonText}>🏳️ REDDITION</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.epicButton, styles.backButton]}
            onPress={() => navigateToScreen('worldMap')}
          >
            <LinearGradient
              colors={['#607D8B', '#546e7a']}
              style={styles.epicButtonGradient}
            >
              <Text style={styles.epicButtonText}>🌍 RETOUR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

// ===== EPIC STYLES =====

const styles = StyleSheet.create({
  epicContainer: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  battleEffectsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  battleEffectsGradient: {
    flex: 1,
  },
  portraitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 20,
    zIndex: 2,
  },
  playerPortrait: {
    width: 120,
    height: 140,
    borderRadius: 15,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 15,
  },
  opponentPortrait: {
    // Removed mirror effect to keep text readable
  },
  portraitGradient: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 35,
    zIndex: -1,
  },
  factionIcon: {
    fontSize: 28,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameEpic: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  opponentName: {
    color: '#ffcccc',
  },
  epicStatContainer: {
    marginBottom: 6,
  },
  epicStatBar: {
    height: 16,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#444',
  },
  epicStatFill: {
    height: '100%',
    borderRadius: 7,
  },
  epicStatText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  epicStatLabel: {
    fontSize: 8,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
  epicTurnIndicator: {
    alignItems: 'center',
    minWidth: 140,
  },
  turnIndicatorGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  epicTurnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  epicCurrentTurn: {
    fontSize: 11,
    color: '#2a2a3e',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
  epicGameOver: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginTop: 3,
  },
  epicGameArea: {
    flex: 1,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  opponentHandContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 8,
    minHeight: 90,
    alignItems: 'center',
  },
  epicHiddenCard: {
    width: 70,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  hiddenCardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
  },
  hiddenCardIcon: {
    fontSize: 30,
    color: '#666',
  },
  battleLogContainer: {
    flex: 1,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  battleLogGradient: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  battleLogTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffd700',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  battleLogScroll: {
    flex: 1,
  },
  battleLogText: {
    fontSize: 11,
    color: '#e0e0e0',
    marginBottom: 6,
    lineHeight: 16,
    textShadowColor: '#000',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  recycleLog: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  turnLog: {
    color: '#ffd700',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  victoryLog: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 12,
  },
  defeatLog: {
    color: '#f44336',
    fontWeight: 'bold',
    fontSize: 12,
  },
  playerHandContainer: {
    maxHeight: 180,
    marginBottom: 15,
  },
  playerHandContent: {
    alignItems: 'center',
    minHeight: 180,
    paddingHorizontal: 10,
  },
  emptyHandEpic: {
    flex: 1,
    width: width - 40,
    height: 160,
    borderRadius: 15,
    overflow: 'hidden',
  },
  emptyHandGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    borderRadius: 15,
  },
  emptyHandTextEpic: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  epicCardContainer: {
    marginHorizontal: 8,
  },
  epicCard: {
    width: 140,
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  disabledCard: {
    opacity: 0.6,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#ffd700',
  },
  epicCardBackground: {
    flex: 1,
  },
  rarityBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
    zIndex: 1,
  },
  epicCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    zIndex: 2,
  },
  costOrb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  costText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  rarityGem: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityIcon: {
    fontSize: 14,
  },
  cardArtArea: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardArtGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTypeIcon: {
    fontSize: 40,
  },
  epicCardInfo: {
    padding: 8,
    backgroundColor: '#2a2a3e90',
  },
  epicCardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  epicCardType: {
    fontSize: 9,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '600',
  },
  epicCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  statContainer: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  statLabel: {
    fontSize: 8,
    color: '#cccccc',
    fontWeight: '600',
  },
  epicCardDescription: {
    fontSize: 8,
    color: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 11,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  disabledText: {
    color: '#ff4444',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  epicActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 15,
    zIndex: 2,
  },
  epicButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  epicButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff40',
  },
  disabledEpicButton: {
    opacity: 0.5,
  },
  epicButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  passButton: {},
  surrenderButton: {},
  backButton: {},
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default EpicBattleScreen;