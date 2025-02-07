import { Card, Rank, Suit, Player, HandRank, HandResult } from '../types/poker';

export const createDeck = (): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  return shuffle(deck);
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const dealCards = (deck: Card[], numPlayers: number): {
  players: Player[];
  remainingDeck: Card[];
} => {
  const players: Player[] = [];
  const remainingDeck = [...deck];

  for (let i = 0; i < numPlayers; i++) {
    const cards = [remainingDeck.pop()!, remainingDeck.pop()!];
    players.push({
      id: i,
      name: i === 0 ? 'You' : `Bot ${i}`,
      isBot: i !== 0,
      chips: 1000,
      cards,
      hasFolded: false,
      currentBet: 0,
    });
  }

  return { players, remainingDeck };
};

export const dealCommunityCards = (deck: Card[]): {
  communityCards: Card[];
  deck: Card[];
} => {
  const remainingDeck = [...deck];
  const communityCards = remainingDeck.splice(0, 5);
  return { communityCards, deck: remainingDeck };
};

const rankValues: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const evaluateHand = (playerCards: Card[], communityCards: Card[]): HandResult => {
  const allCards = [...playerCards, ...communityCards];
  const ranks = allCards.map(card => rankValues[card.rank]);
  const suits = allCards.map(card => card.suit);

  // Check for flush
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<Suit, number>);

  const isFlush = Object.values(suitCounts).some(count => count >= 5);

  // Check for straight
  const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b);
  let isStraight = false;
  let straightHighCard = 0;

  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i + 4] - uniqueRanks[i] === 4) {
      isStraight = true;
      straightHighCard = uniqueRanks[i + 4];
    }
  }

  // Special case for Ace-low straight (A,2,3,4,5)
  if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) &&
      uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
    isStraight = true;
    straightHighCard = 5;
  }

  // Count rank frequencies
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const frequencies = Object.entries(rankCounts)
    .map(([rank, count]) => ({ rank: Number(rank), count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  // Determine hand rank
  if (isFlush && isStraight && straightHighCard === 14) {
    return { rank: 'royal-flush', value: 1000 };
  }
  if (isFlush && isStraight) {
    return { rank: 'straight-flush', value: 900 + straightHighCard };
  }
  if (frequencies[0].count === 4) {
    return { rank: 'four-of-a-kind', value: 800 + frequencies[0].rank };
  }
  if (frequencies[0].count === 3 && frequencies[1].count === 2) {
    return { rank: 'full-house', value: 700 + frequencies[0].rank * 15 + frequencies[1].rank };
  }
  if (isFlush) {
    return { rank: 'flush', value: 600 + Math.max(...ranks) };
  }
  if (isStraight) {
    return { rank: 'straight', value: 500 + straightHighCard };
  }
  if (frequencies[0].count === 3) {
    return { rank: 'three-of-a-kind', value: 400 + frequencies[0].rank };
  }
  if (frequencies[0].count === 2 && frequencies[1].count === 2) {
    return { rank: 'two-pair', value: 300 + Math.max(frequencies[0].rank, frequencies[1].rank) * 15 + Math.min(frequencies[0].rank, frequencies[1].rank) };
  }
  if (frequencies[0].count === 2) {
    return { rank: 'pair', value: 200 + frequencies[0].rank };
  }
  return { rank: 'high-card', value: 100 + Math.max(...ranks) };
};

export const determineWinner = (players: Player[], communityCards: Card[]): { winners: Player[], handRank: HandRank } => {
  const activePlayers = players.filter(player => !player.hasFolded);
  
  if (activePlayers.length === 1) {
    return { 
      winners: [activePlayers[0]],
      handRank: 'high-card' // Default when others fold
    };
  }

  const playerHands = activePlayers.map(player => ({
    player,
    handResult: evaluateHand(player.cards, communityCards)
  }));

  playerHands.sort((a, b) => b.handResult.value - a.handResult.value);

  const highestValue = playerHands[0].handResult.value;
  const winners = playerHands
    .filter(ph => ph.handResult.value === highestValue)
    .map(ph => ph.player);

  return {
    winners,
    handRank: playerHands[0].handResult.rank
  };
};