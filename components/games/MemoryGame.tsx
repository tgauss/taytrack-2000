'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Trip-themed emojis for the cards
const easyEmojis = ['✈️', '🚗', '📦', '🏠'];
const normalEmojis = ['✈️', '🚗', '👨', '🏠', '📦', '⭐'];
const hardEmojis = ['✈️', '🚗', '👨', '🏠', '📦', '⭐', '🤠', '🌽'];

type Difficulty = 'easy' | 'normal' | 'hard';

interface MemoryGameProps {
  onClose: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function MemoryGame({ onClose }: MemoryGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const { setMemoryTime, memoryBestTime, earnBadge, showAchievement } = useGameStore();

  const getEmojis = (d: Difficulty) => {
    switch (d) {
      case 'easy': return easyEmojis;
      case 'normal': return normalEmojis;
      case 'hard': return hardEmojis;
    }
  };

  const getGridCols = (d: Difficulty) => {
    switch (d) {
      case 'easy': return 'grid-cols-4';
      case 'normal': return 'grid-cols-3';
      case 'hard': return 'grid-cols-4';
    }
  };

  // Flip-back delay: slower for easy, faster for hard
  const getFlipDelay = (d: Difficulty) => {
    switch (d) {
      case 'easy': return 2000;
      case 'normal': return 1500;
      case 'hard': return 1000;
    }
  };

  const startGame = (d: Difficulty) => {
    soundManager.tap();
    setDifficulty(d);
    const emojis = getEmojis(d);
    const pairs = [...emojis, ...emojis].map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));
    setCards(shuffleArray(pairs));
    setStartTime(Date.now());
    setFlippedCards([]);
    setMatches(0);
    setMoves(0);
    setGameOver(false);
  };

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2 && difficulty) {
      const [first, second] = flippedCards;
      const firstCard = cards.find(c => c.id === first);
      const secondCard = cards.find(c => c.id === second);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found!
        soundManager.success();
        setCards(prev => prev.map(card =>
          card.id === first || card.id === second
            ? { ...card, isMatched: true }
            : card
        ));
        const newMatches = matches + 1;
        setMatches(newMatches);
        setFlippedCards([]);

        // Check for game over
        const totalPairs = getEmojis(difficulty).length;
        if (newMatches === totalPairs) {
          const time = Date.now() - startTime;
          setEndTime(time);
          setMemoryTime(time);
          setGameOver(true);
          soundManager.fanfare();
          earnBadge('memory-master');
          setTimeout(() => showAchievement('memory-master'), 500);
        }
      } else {
        // No match - flip back after delay
        soundManager.whoops();
        const delay = getFlipDelay(difficulty);
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === first || card.id === second
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, delay);
      }
    }
  }, [flippedCards, cards, matches, startTime, setMemoryTime, difficulty, earnBadge, showAchievement]);

  const handleCardTap = useCallback((cardId: number) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return;
    }

    soundManager.tap();
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
    setMoves(m => m + 1);
  }, [cards, flippedCards.length]);

  const handleClose = () => {
    soundManager.tap();
    onClose();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  // Difficulty selection screen
  if (!difficulty) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-blue-900 to-blue-950 flex items-center justify-center"
      >
        <div className="absolute top-4 left-4">
          <button
            onClick={handleClose}
            className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white touch-manipulation"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center px-8 max-w-sm w-full">
          <div className="text-6xl mb-4">🎴</div>
          <h2 className="text-3xl font-bold text-white mb-8">Memory Match</h2>

          <div className="space-y-4">
            <motion.button
              onClick={() => startGame('easy')}
              className="w-full p-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl text-white font-bold text-xl touch-manipulation"
              whileTap={{ scale: 0.95 }}
            >
              <div>Easy</div>
              <div className="text-sm opacity-80">4 pairs (ages 3-4)</div>
            </motion.button>

            <motion.button
              onClick={() => startGame('normal')}
              className="w-full p-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-white font-bold text-xl touch-manipulation"
              whileTap={{ scale: 0.95 }}
            >
              <div>Normal</div>
              <div className="text-sm opacity-80">6 pairs (ages 5-6)</div>
            </motion.button>

            <motion.button
              onClick={() => startGame('hard')}
              className="w-full p-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-bold text-xl touch-manipulation"
              whileTap={{ scale: 0.95 }}
            >
              <div>Hard</div>
              <div className="text-sm opacity-80">8 pairs (challenge!)</div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  const totalPairs = getEmojis(difficulty).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-blue-900 to-blue-950"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-black/30">
        <button
          onClick={handleClose}
          className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white touch-manipulation"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex gap-6 text-white">
          <div className="text-center">
            <div className="text-sm opacity-70">Matches</div>
            <div className="text-2xl font-bold">{matches}/{totalPairs}</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70">Taps</div>
            <div className="text-2xl font-bold">{moves}</div>
          </div>
        </div>
      </div>

      {/* Game instructions */}
      <div className="absolute top-20 left-0 right-0 text-center text-white">
        <h2 className="text-2xl font-bold mb-1">Match the Pairs!</h2>
        <p className="text-white/70">Tap to flip cards</p>
      </div>

      {/* Card grid */}
      <div className="absolute inset-0 flex items-center justify-center pt-32 pb-8 px-4">
        <div className={`grid ${getGridCols(difficulty)} gap-3 max-w-md w-full`}>
          {cards.map(card => (
            <motion.button
              key={card.id}
              onClick={() => handleCardTap(card.id)}
              className="aspect-square rounded-2xl touch-manipulation"
              whileTap={{ scale: 0.95 }}
              disabled={card.isFlipped || card.isMatched}
            >
              <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Card back */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center border-4 border-white/30"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-4xl">❓</span>
                </div>

                {/* Card front */}
                <div
                  className={`absolute inset-0 rounded-2xl flex items-center justify-center border-4 ${
                    card.isMatched
                      ? 'bg-green-500 border-green-300'
                      : 'bg-white border-gray-200'
                  }`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <motion.span
                    className="text-5xl"
                    animate={card.isMatched ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {card.emoji}
                  </motion.span>
                </div>
              </motion.div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Game Over overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="bg-card rounded-3xl p-8 text-center max-w-sm"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>

              <h2 className="text-3xl font-bold text-foreground mb-4">
                You Did It!
              </h2>

              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="text-2xl font-bold text-primary">{formatTime(endTime)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Taps</div>
                  <div className="text-2xl font-bold text-primary">{moves}</div>
                </div>
              </div>

              {memoryBestTime > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                  {endTime <= memoryBestTime ? '🎉 New best time!' : `Best: ${formatTime(memoryBestTime)}`}
                </p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => { setDifficulty(null); }}
                  className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg touch-manipulation"
                >
                  Play Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-4 bg-muted text-foreground rounded-xl font-bold text-lg touch-manipulation"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
