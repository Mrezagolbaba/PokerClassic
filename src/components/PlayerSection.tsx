import React from 'react';
import { Player } from '../types/poker';
import { Card } from './Card';

interface PlayerSectionProps {
  player: Player;
  isCurrentPlayer: boolean;
  onAction: (action: 'fold' | 'check' | 'raise', amount?: number) => void;
  allowControl?: boolean;
}

export const PlayerSection: React.FC<PlayerSectionProps> = ({
  player,
  isCurrentPlayer,
  onAction,
  allowControl = false,
}) => {
  return (
    <div className={`flex flex-col w-[20%] items-center p-4 rounded-lg ${
      isCurrentPlayer ? 'bg-blue-900 border-2' : 'bg-gray-900'
    }`}>
      <div className="text-lg font-bold mb-2 text-white">{player.name}</div>
      <div className="text-sm mb-2 text-white">Chips: ${player.chips}</div>
      <div className="flex gap-2 mb-4">
        {player.cards.map((card, index) => (
          <Card
            key={index}
            card={!player.isBot || allowControl ? card : undefined}
            hidden={player.isBot && !allowControl}
          />
        ))}
      </div>
      {isCurrentPlayer && (allowControl || !player.isBot) && !player.hasFolded && (
        <div className="flex gap-2">
          <button
            onClick={() => onAction('fold')}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Fold
          </button>
          <button
            onClick={() => onAction('check')}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Check
          </button>
          <button
            onClick={() => onAction('raise', 50)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Raise
          </button>
        </div>
      )}
      {player.hasFolded && (
        <div className="text-red-500 font-bold">Folded</div>
      )}
    </div>
  );
};