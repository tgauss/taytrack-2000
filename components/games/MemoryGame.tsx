'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';

interface Card {
  id: number;
  image: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Trip-themed cards with custom AI art
const CARD_SET = [
  { image: '/game-assets/card-airplane.webp', label: 'Airplane' },
  { image: '/game-assets/card-car.webp', label: 'Truck' },
  { image: '/game-assets/card-dad.webp', label: 'Dad' },
  { image: '/game-assets/card-house.webp', label: 'Home' },
  { image: '/game-assets/card-box.webp', label: 'Box' },
  { image: '/game-assets/card-star.webp', label: 'Star' },
  { image: '/game-assets/card-cowboy.webp', label: 'Cowboy' },
  { image: '/game-assets/card-corn.webp', label: 'Corn' },
];

type Difficulty = 'easy' | 'normal' | 'hard';

function shuffleArray<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MemoryGameProps { onClose: () => void; }

export function MemoryGame({ onClose }: MemoryGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const { setMemoryTime, memoryBestTime, earnBadge, showAchievement } = useGameStore();

  const getPairCount = (d: Difficulty) => d === 'easy' ? 4 : d === 'normal' ? 6 : 8;
  const getGridCols = (d: Difficulty) => d === 'easy' ? 'grid-cols-4' : d === 'normal' ? 'grid-cols-4' : 'grid-cols-4';
  const getFlipDelay = (d: Difficulty) => d === 'easy' ? 2000 : d === 'normal' ? 1500 : 1000;

  const startGame = (d: Difficulty) => {
    soundManager.tap();
    setDifficulty(d);
    const count = getPairCount(d);
    const selected = CARD_SET.slice(0, count);
    const pairs = [...selected, ...selected].map((card, i) => ({
      id: i,
      image: card.image,
      label: card.label,
      isFlipped: false,
      isMatched: false,
    }));
    setCards(shuffleArray(pairs));
    setStartTime(Date.now());
    setFlippedCards([]); setMatches(0); setMoves(0); setGameOver(false);
  };

  // Check matches
  useEffect(() => {
    if (flippedCards.length === 2 && difficulty) {
      const [first, second] = flippedCards;
      const c1 = cards.find(c => c.id === first);
      const c2 = cards.find(c => c.id === second);

      if (c1 && c2 && c1.image === c2.image) {
        soundManager.success();
        setCards(prev => prev.map(c =>
          c.id === first || c.id === second ? { ...c, isMatched: true } : c
        ));
        const nm = matches + 1;
        setMatches(nm);
        setFlippedCards([]);

        if (nm === getPairCount(difficulty)) {
          const time = Date.now() - startTime;
          setEndTime(time);
          setMemoryTime(time);
          setGameOver(true);
          soundManager.fanfare();
          earnBadge('memory-master');
          setTimeout(() => showAchievement('memory-master'), 500);
        }
      } else {
        soundManager.whoops();
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first || c.id === second ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
        }, getFlipDelay(difficulty));
      }
    }
  }, [flippedCards, cards, matches, startTime, setMemoryTime, difficulty, earnBadge, showAchievement]);

  const handleCardTap = useCallback((cardId: number) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;
    soundManager.tap();
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));
    setFlippedCards(prev => [...prev, cardId]);
    setMoves(m => m + 1);
  }, [cards, flippedCards.length]);

  const formatTime = (ms: number) => `${Math.floor(ms / 1000)}s`;

  // Difficulty selection
  if (!difficulty) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-blue-900 to-indigo-950 flex items-center justify-center">
        <div className="absolute top-4 left-4">
          <button onClick={() => { soundManager.tap(); onClose(); }}
            className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl touch-manipulation">
            ←
          </button>
        </div>
        <div className="text-center px-8 max-w-sm w-full">
          <img src="/game-assets/card-star.webp" alt="" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-8">Memory Match!</h2>
          <div className="space-y-4">
            {([
              { d: 'easy' as Difficulty, label: 'Easy', sub: '4 pairs', color: 'from-green-500 to-emerald-500' },
              { d: 'normal' as Difficulty, label: 'Normal', sub: '6 pairs', color: 'from-blue-500 to-cyan-500' },
              { d: 'hard' as Difficulty, label: 'Hard', sub: '8 pairs', color: 'from-purple-500 to-pink-500' },
            ]).map(opt => (
              <motion.button key={opt.d} onClick={() => startGame(opt.d)} whileTap={{ scale: 0.95 }}
                className={`w-full p-5 bg-gradient-to-r ${opt.color} rounded-2xl text-white font-bold text-xl touch-manipulation`}>
                <div>{opt.label}</div>
                <div className="text-sm opacity-80">{opt.sub}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  const totalPairs = getPairCount(difficulty);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-blue-900 to-indigo-950">

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-black/30">
        <button onClick={() => { soundManager.tap(); onClose(); }}
          className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl touch-manipulation">
          ←
        </button>
        <div className="flex gap-6 text-white">
          <div className="text-center">
            <div className="text-xs opacity-60">Matches</div>
            <div className="text-2xl font-bold">{matches}/{totalPairs}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-60">Taps</div>
            <div className="text-2xl font-bold">{moves}</div>
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="absolute inset-0 flex items-center justify-center pt-20 pb-8 px-4">
        <div className={`grid ${getGridCols(difficulty)} gap-3 max-w-lg w-full`}>
          {cards.map(card => (
            <motion.button
              key={card.id}
              onClick={() => handleCardTap(card.id)}
              className="aspect-square rounded-2xl touch-manipulation overflow-hidden"
              whileTap={{ scale: 0.93 }}
              disabled={card.isFlipped || card.isMatched}
            >
              <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                transition={{ duration: 0.35 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Card back */}
                <div
                  className="absolute inset-0 rounded-2xl flex items-center justify-center overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <img src="/game-assets/card-back.webp" alt="" className="w-full h-full object-cover" />
                </div>

                {/* Card front */}
                <div
                  className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-2 ${
                    card.isMatched ? 'bg-green-500/90 ring-4 ring-green-300' : 'bg-white'
                  }`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <motion.img
                    src={card.image}
                    alt={card.label}
                    className="w-3/4 h-3/4 object-contain"
                    animate={card.isMatched ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  />
                  <span className={`text-xs font-bold mt-1 ${card.isMatched ? 'text-white' : 'text-gray-600'}`}>
                    {card.label}
                  </span>
                </div>
              </motion.div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Game Over */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center p-8 z-30">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="bg-slate-900 rounded-3xl p-8 text-center max-w-sm w-full border border-white/10">
              <img src="/game-assets/card-star.webp" alt="" className="w-20 h-20 object-contain mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">You Did It!</h2>
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-sm text-white/50">Time</div>
                  <div className="text-2xl font-bold text-cyan-400">{formatTime(endTime)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-white/50">Taps</div>
                  <div className="text-2xl font-bold text-purple-400">{moves}</div>
                </div>
              </div>
              {memoryBestTime > 0 && (
                <p className="text-sm text-white/40 mb-4">
                  {endTime <= memoryBestTime ? '🎉 NEW BEST TIME!' : `Best: ${formatTime(memoryBestTime)}`}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setDifficulty(null)}
                  className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-lg touch-manipulation">
                  Again!
                </button>
                <button onClick={() => { soundManager.tap(); onClose(); }}
                  className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold text-lg touch-manipulation">
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
