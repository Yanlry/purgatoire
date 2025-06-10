import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { 
  ScreenProps, 
  Card, 
  BotPlayer, 
  Battle,
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

interface BattleState {
  playerHealth: number;
  opponentHealth: number;
  playerMana: number;
  opponentMana: number;
  playerHand: Card[];
  opponentHand: Card[];
  playerDeck: Card[];
  opponentDeck: Card[];
  turn: 'player' | 'opponent';
  turnNumber: number;
  selectedCard: Card | null;
  battleLog: string[];
  isGameOver: boolean;
  winner: 'player' | 'opponent' | null;
}

/**
 * Écran de combat - Cœur du gameplay avec système de cartes interactif
 */
const BattleScreen: React.FC<ScreenProps> = ({
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
      playerHand: shuffledPlayerDeck.slice(0, 3),
      opponentHand: shuffledOpponentDeck.slice(0, 3),
      playerDeck: shuffledPlayerDeck.slice(3),
      opponentDeck: shuffledOpponentDeck.slice(3),
      turn: 'player',
      turnNumber: 1,
      selectedCard: null,
      battleLog: [`Le combat commence ! ${player.username} vs ${opponent.username}`],
      isGameOver: false,
      winner: null,
    };
  });

  const [cardAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (battleState.isGameOver && battleState.winner) {
      handleGameOver();
    }
  }, [battleState.isGameOver, battleState.winner]);

  /**
   * Gère la fin de partie
   */
  const handleGameOver = async (): Promise<void> => {
    if (!player || !battleState.winner) return;

    const playerWon = battleState.winner === 'player';
    const experienceGained = playerWon ? GAME_CONSTANTS.EXPERIENCE_PER_WIN : GAME_CONSTANTS.EXPERIENCE_PER_LOSS;
    
    // Met à jour les stats du joueur
    const updatedPlayer = {
      ...player,
      experience: player.experience + experienceGained,
      wins: playerWon ? player.wins + 1 : player.wins,
      losses: playerWon ? player.losses : player.losses + 1,
    };

    // Vérifie le niveau
    const newLevel = Math.floor(updatedPlayer.experience / 1000) + 1;
    if (newLevel > updatedPlayer.level) {
      updatedPlayer.level = newLevel;
      Alert.alert('🎉 Niveau Supérieur !', `Vous êtes maintenant niveau ${newLevel} !`);
    }

    await setPlayer(updatedPlayer);

    // Met à jour le contrôle de région si victoire
    if (playerWon) {
      await updateRegionControl('neutral_plains', player.faction, 15);
    }

    Alert.alert(
      playerWon ? '🎉 Victoire !' : '💀 Défaite',
      `${playerWon ? 'Félicitations ! Vous avez vaincu' : 'Vous avez été vaincu par'} ${opponent.username}\n\n` +
      `Expérience gagnée: +${experienceGained}\n` +
      `Niveau: ${updatedPlayer.level}`,
      [
        { text: 'Retour à la carte', onPress: () => navigateToScreen('worldMap') }
      ]
    );
  };

  /**
   * Joue une carte
   */
  const playCard = (card: Card): void => {
    if (battleState.turn !== 'player' || battleState.isGameOver) return;
    if (card.cost > battleState.playerMana) {
      Alert.alert('Pas assez de mana', `Cette carte coûte ${card.cost} mana.`);
      return;
    }

    // Animation de carte
    Animated.sequence([
      Animated.timing(cardAnimation, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(cardAnimation, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    const newState = { ...battleState };
    
    // Retire la carte de la main et réduit le mana
    newState.playerHand = newState.playerHand.filter(c => c.id !== card.id);
    newState.playerMana -= card.cost;

    // Applique l'effet de la carte
    const effect = applyCardEffect(card, 'player', newState);
    newState.battleLog.push(effect.message);
    
    if (effect.damage > 0) {
      newState.opponentHealth = Math.max(0, newState.opponentHealth - effect.damage);
    }
    if (effect.healing > 0) {
      newState.playerHealth = Math.min(GAME_CONSTANTS.STARTING_HEALTH, newState.playerHealth + effect.healing);
    }

    // Vérifie la fin de partie
    if (newState.opponentHealth <= 0) {
      newState.isGameOver = true;
      newState.winner = 'player';
    } else {
      // Passe le tour
      setTimeout(() => opponentTurn(newState), 1000);
    }

    setBattleState(newState);
  };

  /**
   * Applique l'effet d'une carte
   */
  const applyCardEffect = (card: Card, caster: 'player' | 'opponent', state: BattleState) => {
    let damage = 0;
    let healing = 0;
    let message = `${caster === 'player' ? player?.username : opponent.username} joue ${card.name}`;

    switch (card.type) {
      case 'creature':
        damage = card.attack || 0;
        message += ` et attaque pour ${damage} dégâts !`;
        break;
      case 'spell':
        if (card.abilities && card.abilities.length > 0) {
          const ability = card.abilities[0];
          if (ability.effect.includes('damage')) {
            damage = parseInt(ability.effect.split('_')[1]) || 3;
            message += ` et inflige ${damage} dégâts !`;
          } else if (ability.effect.includes('heal')) {
            healing = parseInt(ability.effect.split('_')[1]) || 3;
            message += ` et soigne ${healing} points de vie !`;
          }
        }
        break;
      case 'equipment':
        damage = card.attack || 0;
        message += ` et équipe une arme (+${damage} attaque) !`;
        break;
    }

    return { damage, healing, message };
  };

  /**
   * Tour de l'adversaire (IA simple)
   */
  const opponentTurn = (currentState: BattleState): void => {
    const newState = { ...currentState };
    
    // L'IA joue une carte aléatoire qu'elle peut se permettre
    const playableCards = newState.opponentHand.filter(card => card.cost <= newState.opponentMana);
    
    if (playableCards.length > 0) {
      const cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
      
      newState.opponentHand = newState.opponentHand.filter(c => c.id !== cardToPlay.id);
      newState.opponentMana -= cardToPlay.cost;

      const effect = applyCardEffect(cardToPlay, 'opponent', newState);
      newState.battleLog.push(effect.message);
      
      if (effect.damage > 0) {
        newState.playerHealth = Math.max(0, newState.playerHealth - effect.damage);
      }
      if (effect.healing > 0) {
        newState.opponentHealth = Math.min(GAME_CONSTANTS.STARTING_HEALTH, newState.opponentHealth + effect.healing);
      }
    }

    // Vérifie la fin de partie
    if (newState.playerHealth <= 0) {
      newState.isGameOver = true;
      newState.winner = 'opponent';
    } else {
      // Nouveau tour
      newState.turn = 'player';
      newState.turnNumber += 1;
      newState.playerMana = Math.min(GAME_CONSTANTS.MAX_MANA, newState.turnNumber);
      newState.opponentMana = Math.min(GAME_CONSTANTS.MAX_MANA, newState.turnNumber);
      
      // Pioche une carte pour chaque joueur
      if (newState.playerDeck.length > 0 && newState.playerHand.length < GAME_CONSTANTS.MAX_HAND_SIZE) {
        newState.playerHand.push(newState.playerDeck.pop()!);
      }
      if (newState.opponentDeck.length > 0 && newState.opponentHand.length < GAME_CONSTANTS.MAX_HAND_SIZE) {
        newState.opponentHand.push(newState.opponentDeck.pop()!);
      }
    }

    setBattleState(newState);
  };

  /**
   * Passe le tour
   */
  const passTurn = (): void => {
    if (battleState.turn !== 'player' || battleState.isGameOver) return;
    
    const newState = { ...battleState };
    setTimeout(() => opponentTurn(newState), 500);
  };

  /**
   * Abandonne le combat
   */
  const surrender = (): void => {
    Alert.alert(
      'Abandonner',
      'Êtes-vous sûr de vouloir abandonner ce combat ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui', 
          onPress: () => {
            const newState = { ...battleState };
            newState.isGameOver = true;
            newState.winner = 'opponent';
            setBattleState(newState);
          }
        }
      ]
    );
  };

  if (!player) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur: Aucun joueur trouvé</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Header de combat */}
      <View style={styles.battleHeader}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {player.faction === 'angel' ? '👼' : '😈'} {player.username}
          </Text>
          <View style={styles.healthBar}>
            <View 
              style={[
                styles.healthFill, 
                { 
                  width: `${(battleState.playerHealth / GAME_CONSTANTS.STARTING_HEALTH) * 100}%`,
                  backgroundColor: FACTION_COLORS[player.faction].primary
                }
              ]} 
            />
            <Text style={styles.healthText}>{battleState.playerHealth}</Text>
          </View>
          <Text style={styles.manaText}>💎 {battleState.playerMana} mana</Text>
        </View>

        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>Tour {battleState.turnNumber}</Text>
          <Text style={styles.currentTurn}>
            {battleState.turn === 'player' ? 'Votre tour' : 'Tour adversaire'}
          </Text>
        </View>

        <View style={styles.opponentInfo}>
          <Text style={styles.opponentName}>
            {opponent.faction === 'angel' ? '👼' : '😈'} {opponent.username}
          </Text>
          <View style={styles.healthBar}>
            <View 
              style={[
                styles.healthFill, 
                { 
                  width: `${(battleState.opponentHealth / GAME_CONSTANTS.STARTING_HEALTH) * 100}%`,
                  backgroundColor: FACTION_COLORS[opponent.faction].primary
                }
              ]} 
            />
            <Text style={styles.healthText}>{battleState.opponentHealth}</Text>
          </View>
          <Text style={styles.manaText}>💎 {battleState.opponentMana} mana</Text>
        </View>
      </View>

      {/* Main game area */}
      <View style={styles.gameArea}>
        
        {/* Cartes adversaire (cachées) */}
        <View style={styles.opponentHand}>
          {battleState.opponentHand.map((_, index) => (
            <View key={index} style={styles.hiddenCard}>
              <Text style={styles.hiddenCardText}>🂠</Text>
            </View>
          ))}
        </View>

        {/* Zone de bataille centrale */}
        <View style={styles.battleField}>
          <ScrollView 
            style={styles.battleLog}
            showsVerticalScrollIndicator={false}
          >
            {battleState.battleLog.map((log, index) => (
              <Text key={index} style={styles.logText}>
                • {log}
              </Text>
            ))}
          </ScrollView>
        </View>

        {/* Main du joueur */}
        <ScrollView 
          horizontal 
          style={styles.playerHand}
          showsHorizontalScrollIndicator={false}
        >
          {battleState.playerHand.map((card) => (
            <Animated.View
              key={card.id}
              style={[
                styles.cardContainer,
                { transform: [{ scale: cardAnimation }] }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  { 
                    borderColor: RARITY_COLORS[card.rarity],
                    opacity: card.cost > battleState.playerMana ? 0.5 : 1
                  }
                ]}
                onPress={() => playCard(card)}
                disabled={card.cost > battleState.playerMana || battleState.turn !== 'player'}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    CARD_TYPE_COLORS[card.type],
                    '#2a2a3e'
                  ]}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardCost}>💎{card.cost}</Text>
                    <Text style={styles.cardRarity}>
                      {card.rarity === 'legendary' ? '⭐' : 
                       card.rarity === 'epic' ? '💎' : 
                       card.rarity === 'rare' ? '🔹' : '⚪'}
                    </Text>
                  </View>
                  
                  <Text style={styles.cardName}>{card.name}</Text>
                  <Text style={styles.cardType}>{card.type}</Text>
                  
                  {card.attack !== undefined && (
                    <View style={styles.cardStats}>
                      <Text style={styles.cardStat}>⚔️ {card.attack}</Text>
                      {card.health && <Text style={styles.cardStat}>❤️ {card.health}</Text>}
                    </View>
                  )}
                  
                  <Text style={styles.cardDescription}>{card.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={passTurn}
          disabled={battleState.turn !== 'player' || battleState.isGameOver}
        >
          <Text style={styles.actionButtonText}>⏭️ Passer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.surrenderButton]}
          onPress={surrender}
          disabled={battleState.isGameOver}
        >
          <Text style={styles.actionButtonText}>🏳️ Abandon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.backButton]}
          onPress={() => navigateToScreen('worldMap')}
        >
          <Text style={styles.actionButtonText}>🔙 Retour</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  battleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  playerInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  opponentInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  healthBar: {
    width: 120,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
    position: 'relative',
  },
  healthFill: {
    height: '100%',
    borderRadius: 10,
  },
  healthText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  manaText: {
    fontSize: 12,
    color: '#87CEEB',
    fontWeight: '600',
  },
  turnIndicator: {
    alignItems: 'center',
  },
  turnText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  currentTurn: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 2,
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: 10,
  },
  opponentHand: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 5,
  },
  hiddenCard: {
    width: 60,
    height: 80,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenCardText: {
    fontSize: 24,
    color: '#666',
  },
  battleField: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    margin: 10,
    padding: 15,
  },
  battleLog: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 5,
    lineHeight: 16,
  },
  playerHand: {
    maxHeight: 160,
    marginBottom: 10,
  },
  cardContainer: {
    marginHorizontal: 5,
  },
  card: {
    width: 120,
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  cardCost: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#87CEEB',
  },
  cardRarity: {
    fontSize: 12,
  },
  cardName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 3,
  },
  cardType: {
    fontSize: 9,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  cardStat: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 8,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: '#4CAF50',
  },
  surrenderButton: {
    backgroundColor: '#f44336',
  },
  backButton: {
    backgroundColor: '#607D8B',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  errorText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default BattleScreen;