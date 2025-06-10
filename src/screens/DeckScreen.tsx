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

import type { 
  ScreenProps, 
  Card, 
  CardType, 
  CardRarity 
} from '../types/gameTypes';
import { 
  FACTION_COLORS, 
  RARITY_COLORS, 
  CARD_TYPE_COLORS,
  GAME_CONSTANTS 
} from '../types/gameTypes';

const { width } = Dimensions.get('window');

type ViewMode = 'deck' | 'collection';
type FilterType = 'all' | CardType;
type SortType = 'name' | 'cost' | 'rarity' | 'type';

/**
 * Écran de gestion du deck - Construction et modification des cartes
 */
const DeckScreen: React.FC<ScreenProps> = ({
  player,
  setPlayer,
  navigateToScreen,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('deck');
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('cost');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (player) {
      setSelectedCards(player.deck);
    }
  }, [player]);

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
   * Filtre et trie les cartes selon les critères sélectionnés
   */
  const getFilteredCards = (): Card[] => {
    const cards = viewMode === 'deck' ? selectedCards : player.collection;
    
    let filtered = cards.filter(card => {
      // Filtre par type
      if (filterType !== 'all' && card.type !== filterType) return false;
      
      // Filtre par recherche
      if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return a.cost - b.cost;
        case 'rarity':
          const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  };

  /**
   * Ajoute une carte au deck en construction
   */
  const addCardToDeck = (card: Card): void => {
    if (selectedCards.length >= GAME_CONSTANTS.MAX_DECK_SIZE) {
      Alert.alert('Deck complet', `Votre deck ne peut contenir que ${GAME_CONSTANTS.MAX_DECK_SIZE} cartes maximum.`);
      return;
    }

    // Vérifie le nombre de copies (max 3 par carte)
    const cardCount = selectedCards.filter(c => c.name === card.name).length;
    if (cardCount >= 3) {
      Alert.alert('Limite atteinte', 'Vous ne pouvez avoir que 3 copies maximum de la même carte.');
      return;
    }

    setSelectedCards([...selectedCards, card]);
  };

  /**
   * Retire une carte du deck
   */
  const removeCardFromDeck = (cardId: string): void => {
    setSelectedCards(selectedCards.filter(card => card.id !== cardId));
  };

  /**
   * Sauvegarde le deck modifié
   */
  const saveDeck = async (): Promise<void> => {
    if (selectedCards.length < GAME_CONSTANTS.MIN_DECK_SIZE) {
      Alert.alert(
        'Deck incomplet', 
        `Votre deck doit contenir au moins ${GAME_CONSTANTS.MIN_DECK_SIZE} cartes.`
      );
      return;
    }

    try {
      const updatedPlayer = {
        ...player,
        deck: selectedCards
      };
      
      await setPlayer(updatedPlayer);
      Alert.alert('✅ Succès', 'Votre deck a été sauvegardé !');
    } catch (error) {
      Alert.alert('❌ Erreur', 'Impossible de sauvegarder le deck');
    }
  };

  /**
   * Réinitialise le deck aux cartes originales
   */
  const resetDeck = (): void => {
    Alert.alert(
      'Réinitialiser le deck',
      'Êtes-vous sûr de vouloir annuler tous les changements ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: () => setSelectedCards(player.deck)
        }
      ]
    );
  };

  /**
   * Calcule les statistiques du deck
   */
  const getDeckStats = () => {
    const stats = {
      totalCards: selectedCards.length,
      averageCost: selectedCards.reduce((sum, card) => sum + card.cost, 0) / selectedCards.length || 0,
      creatures: selectedCards.filter(card => card.type === 'creature').length,
      spells: selectedCards.filter(card => card.type === 'spell').length,
      equipment: selectedCards.filter(card => card.type === 'equipment').length,
      rarities: {
        common: selectedCards.filter(card => card.rarity === 'common').length,
        rare: selectedCards.filter(card => card.rarity === 'rare').length,
        epic: selectedCards.filter(card => card.rarity === 'epic').length,
        legendary: selectedCards.filter(card => card.rarity === 'legendary').length,
      }
    };
    
    return stats;
  };

  const filteredCards = getFilteredCards();
  const deckStats = getDeckStats();

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
        
        <Text style={styles.title}>
          {player.faction === 'angel' ? '👼' : '😈'} Gestion du Deck
        </Text>
        
        <View style={styles.deckCounter}>
          <Text style={styles.deckCounterText}>
            {selectedCards.length}/{GAME_CONSTANTS.MAX_DECK_SIZE}
          </Text>
        </View>
      </View>

      {/* Mode Switch */}
      <View style={styles.modeSwitch}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            viewMode === 'deck' && styles.activeModeButton
          ]}
          onPress={() => setViewMode('deck')}
        >
          <Text style={[
            styles.modeButtonText,
            viewMode === 'deck' && styles.activeModeButtonText
          ]}>
            🃏 Deck Actuel ({selectedCards.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            viewMode === 'collection' && styles.activeModeButton
          ]}
          onPress={() => setViewMode('collection')}
        >
          <Text style={[
            styles.modeButtonText,
            viewMode === 'collection' && styles.activeModeButtonText
          ]}>
            📚 Collection ({player.collection.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistiques du deck */}
      {viewMode === 'deck' && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statistiques du Deck</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{deckStats.averageCost.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Coût moyen</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{deckStats.creatures}</Text>
              <Text style={styles.statLabel}>Créatures</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{deckStats.spells}</Text>
              <Text style={styles.statLabel}>Sorts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{deckStats.equipment}</Text>
              <Text style={styles.statLabel}>Équipements</Text>
            </View>
          </View>
        </View>
      )}

      {/* Filtres et recherche */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une carte..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.activeFilterButton]}
            onPress={() => setFilterType('all')}
          >
            <Text style={styles.filterButtonText}>Toutes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'creature' && styles.activeFilterButton]}
            onPress={() => setFilterType('creature')}
          >
            <Text style={styles.filterButtonText}>🐲 Créatures</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'spell' && styles.activeFilterButton]}
            onPress={() => setFilterType('spell')}
          >
            <Text style={styles.filterButtonText}>✨ Sorts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'equipment' && styles.activeFilterButton]}
            onPress={() => setFilterType('equipment')}
          >
            <Text style={styles.filterButtonText}>⚔️ Équipements</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Liste des cartes */}
      <ScrollView style={styles.cardsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsGrid}>
          {filteredCards.map((card, index) => (
            <TouchableOpacity
              key={`${card.id}-${index}`}
              style={[
                styles.cardItem,
                { borderColor: RARITY_COLORS[card.rarity] }
              ]}
              onPress={() => {
                if (viewMode === 'collection') {
                  addCardToDeck(card);
                } else {
                  removeCardFromDeck(card.id);
                }
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[CARD_TYPE_COLORS[card.type], '#2a2a3e']}
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
                
                {viewMode === 'deck' && (
                  <View style={styles.cardCount}>
                    <Text style={styles.cardCountText}>
                      {selectedCards.filter(c => c.name === card.name).length}x
                    </Text>
                  </View>
                )}
                
                {viewMode === 'collection' && (
                  <View style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Ajouter</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Actions du deck */}
      {viewMode === 'deck' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={resetDeck}
          >
            <Text style={styles.actionButtonText}>🔄 Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.saveButton,
              selectedCards.length < GAME_CONSTANTS.MIN_DECK_SIZE && styles.disabledButton
            ]}
            onPress={saveDeck}
            disabled={selectedCards.length < GAME_CONSTANTS.MIN_DECK_SIZE}
          >
            <Text style={styles.actionButtonText}>💾 Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      )}
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
  deckCounter: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deckCounterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modeSwitch: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#4CAF50',
  },
  modeButtonText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '600',
  },
  activeModeButtonText: {
    color: '#ffffff',
  },
  statsContainer: {
    backgroundColor: '#2a2a3e',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  filtersScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 20,
  },
  cardItem: {
    width: (width - 50) / 2,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardGradient: {
    padding: 12,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardType: {
    fontSize: 10,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  cardStat: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 9,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: 8,
  },
  cardCount: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#f44336',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardCountText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingVertical: 4,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f44336',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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

export default DeckScreen;