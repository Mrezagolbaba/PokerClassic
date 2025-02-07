import React from 'react';
import { Card as CardType } from '../types/poker';

interface CardProps {
  card?: CardType;
  hidden?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, hidden }) => {
  if (hidden || !card) {
    return (
      <div className="w-20 h-28 bg-blue-800 rounded-lg border-2 border-white shadow-lg" />
    );
  }

  const getSuitIcon = () => {
    const props = { 
      className: card.suit === 'hearts' || card.suit === 'diamonds' 
        ? 'text-red-500' 
        : 'text-black',
      size: 25 
    };

    switch (card.suit) {
      case 'hearts': return <span {...props}>♥</span>;
      case 'diamonds': return <span {...props}>♦</span>;
      case 'clubs': return <span {...props}>♣</span>;
      case 'spades': return <span {...props}>♠</span>;
    }
  };

  return (
    <div className="w-20 h-28 bg-white rounded-lg border-2 border-gray-300 shadow-lg flex flex-col items-center justify-between p-2">
      <div className="text-lg font-bold">{card.rank}</div>
      {getSuitIcon()}
      <div className="text-lg font-bold rotate-180">{card.rank}</div>
    </div>
  );
};