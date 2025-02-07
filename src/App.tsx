import  { useState } from 'react';
import { Card as CardComponent } from './components/Card';
import { PlayerSection } from './components/PlayerSection';
import { GameState, GamePhase, Player, HandRank } from './types/poker';
import { createDeck, dealCards, dealCommunityCards, determineWinner } from './utils/poker';

function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = createDeck();
    const { players, remainingDeck } = dealCards(deck, 3);
    const { communityCards, deck: newDeck } = dealCommunityCards(remainingDeck);
    return {
      players,
      communityCards,
      currentPlayer: 0,
      pot: 0,
      currentBet: 0,
      phase: 'preflop' as GamePhase,
      deck: newDeck,
      actionsThisRound: 0,
    };
  });

  const [winners, setWinners] = useState<Player[]>([]);
  const [winningHand, setWinningHand] = useState<HandRank | null>(null);

  const handlePlayerAction = (action: 'fold' | 'check' | 'raise', amount?: number) => {
    setGameState((prev) => {
      const newPlayers = [...prev.players];
      const currentPlayer = newPlayers[prev.currentPlayer];

      switch (action) {
        case 'fold':
          currentPlayer.hasFolded = true;
          break;
        case 'check':
          break;
        case 'raise':
          if (amount) {
            currentPlayer.chips -= amount;
            currentPlayer.currentBet += amount;
            prev.pot += amount;
            prev.currentBet = currentPlayer.currentBet;
          }
          break;
      }

      let nextPlayer = (prev.currentPlayer + 1) % prev.players.length;
      while (newPlayers[nextPlayer].hasFolded && nextPlayer !== prev.currentPlayer) {
        nextPlayer = (nextPlayer + 1) % prev.players.length;
      }

      const newActionsThisRound = prev.actionsThisRound + 1;
      const shouldAdvancePhase = newActionsThisRound >= prev.players.length;

      if (shouldAdvancePhase) {
        const phases: GamePhase[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
        const currentIndex = phases.indexOf(prev.phase);
        const nextPhase = phases[currentIndex + 1] || 'showdown';
        
        if (nextPhase === 'showdown') {
          const result = determineWinner(newPlayers, prev.communityCards);
          setWinners(result.winners);
          setWinningHand(result.handRank);
        }

        return {
          ...prev,
          players: newPlayers,
          currentPlayer: 0,
          phase: nextPhase,
          actionsThisRound: 0,
        };
      }

      return {
        ...prev,
        players: newPlayers,
        currentPlayer: nextPlayer,
        actionsThisRound: newActionsThisRound,
      };
    });
  };

  const revealedCards = () => {
    switch (gameState.phase) {
      case 'preflop':
        return 0;
      case 'flop':
        return 3;
      case 'turn':
        return 4;
      case 'river':
      case 'showdown':
        return 5;
      default:
        return 0;
    }
  };

  const formatHandRank = (rank: HandRank): string => {
    return rank.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-zinc-800 p-8">
      <div className="mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Poker Table</h1>
          <div className="bg-green-700 h-96 p-4 shadow-lg rounded-full w-[70%] border-8 border-yellow-600 mx-auto">
            <div className="text-white mb-4">
              <div>Pot: ${gameState.pot}</div>
              <div>Phase: {gameState.phase}</div>
              <div>Actions this round: {gameState.actionsThisRound} / {gameState.players.length}</div>
              {winners.length > 0 && (
                <div className="mt-2">
                  <div className="text-yellow-300 font-bold">
                    Winner{winners.length > 1 ? 's' : ''}: {winners.map(w => w.name).join(', ')}
                  </div>
                  {winningHand && (
                    <div className="text-yellow-200">
                      Winning Hand: {formatHandRank(winningHand)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 mb-4 ">
              {gameState.communityCards.slice(0, revealedCards()).map((card, index) => (
                <CardComponent key={index} card={card} />
              ))}
              {Array.from({ length: 5 - revealedCards() }).map((_, index) => (
                <CardComponent key={`placeholder-${index}`} hidden />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-4 items-center justify-center">
          {gameState.players.map((player, index) => (
            <PlayerSection
              key={player.id}
              player={player}
              isCurrentPlayer={gameState.currentPlayer === index}
              onAction={handlePlayerAction}
              allowControl={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;