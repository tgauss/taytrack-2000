'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';

const ITEMS = ['🧸', '👕', '📱', '🧴', '👖', '🧦', '📚', '🎒', '🧢', '⌚', '🪥', '👟'];
const BOX_WIDTH = 120; // px

interface FallingItem {
  id: number;
  emoji: string;
  x: number; // percent 0-100
  y: number; // percent 0-100
  speed: number;
  caught: boolean;
}

interface PackingGameProps {
  onClose: () => void;
}

export function PackingGame({ onClose }: PackingGameProps) {
  const [items, setItems] = useState<FallingItem[]>([]);
  const [boxX, setBoxX] = useState(50); // percent
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const { setPackingScore, packingHighScore, earnBadge, showAchievement } = useGameStore();

  // Spawn items — gentle pace for kids
  useEffect(() => {
    if (gameOver) return;
    const spawnRate = Math.max(1200, 2000 - score * 30);
    const interval = setInterval(() => {
      setItems(prev => [...prev, {
        id: Date.now() + Math.random(),
        emoji: ITEMS[Math.floor(Math.random() * ITEMS.length)],
        x: 10 + Math.random() * 80,
        y: -8,
        speed: 0.4 + Math.random() * 0.2, // Slow for kids
        caught: false,
      }]);
    }, spawnRate);
    return () => clearInterval(interval);
  }, [gameOver, score]);

  // Move items down + check catches
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setItems(prev => {
        const updated = prev.map(item => {
          if (item.caught) return item;
          const newY = item.y + item.speed;

          // Check if item reached the box zone (bottom 12%)
          if (newY >= 82 && newY <= 95) {
            const itemCenter = item.x;
            const boxLeft = boxX - 10;
            const boxRight = boxX + 10;
            if (itemCenter >= boxLeft && itemCenter <= boxRight) {
              soundManager.pop();
              setScore(s => s + 1);
              return { ...item, y: newY, caught: true };
            }
          }

          // Missed — fell off screen
          if (newY > 100) {
            setMissed(m => m + 1);
            return { ...item, y: newY, caught: true }; // Mark as done
          }

          return { ...item, y: newY };
        });
        return updated.filter(item => !(item.caught && item.y > 100));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [gameOver, boxX]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setPackingScore(score);
          if (score >= 15) { earnBadge('box-champion'); setTimeout(() => showAchievement('box-champion'), 500); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, score, setPackingScore, earnBadge, showAchievement]);

  // Touch/mouse move — drag the box
  const handleMove = useCallback((clientX: number) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setBoxX(Math.max(10, Math.min(90, x)));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons > 0) handleMove(e.clientX);
  }, [handleMove]);

  const handlePlayAgain = () => {
    soundManager.tap();
    setItems([]); setScore(0); setMissed(0);
    setTimeLeft(30); setGameOver(false); setBoxX(50);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-900 via-purple-900 to-purple-950 select-none"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-black/30">
        <button onClick={() => { soundManager.tap(); onClose(); }}
          className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl touch-manipulation">
          ✕
        </button>
        <div className="flex gap-6 text-white">
          <div className="text-center">
            <div className="text-xs opacity-60">Caught</div>
            <div className="text-2xl font-bold text-green-400">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-60">Missed</div>
            <div className="text-2xl font-bold text-red-400">{missed}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-60">Time</div>
            <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{timeLeft}</div>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div
        ref={gameAreaRef}
        className="absolute inset-0 pt-20 overflow-hidden touch-manipulation"
        onTouchMove={handleTouchMove}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
        onMouseMove={handleMouseMove}
        onMouseDown={(e) => handleMove(e.clientX)}
        style={{ touchAction: 'none' }}
      >
        {/* Falling items */}
        {items.filter(i => !i.caught).map(item => (
          <div
            key={item.id}
            className="absolute text-4xl transition-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Catch effects */}
        <AnimatePresence>
          {items.filter(i => i.caught && i.y < 100).map(item => (
            <motion.div
              key={`caught-${item.id}`}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0, y: -30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute text-3xl"
              style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              ⭐
            </motion.div>
          ))}
        </AnimatePresence>

        {/* The box — drag left/right */}
        <div
          className="absolute"
          style={{
            left: `${boxX}%`,
            bottom: '5%',
            transform: 'translateX(-50%)',
            width: `${BOX_WIDTH}px`,
          }}
        >
          <div className="text-center">
            <div className="text-6xl">📦</div>
            {/* Visual guide — wider catch zone indicator */}
            <div className="h-1 bg-yellow-400/30 rounded-full mx-2 -mt-1" />
          </div>
        </div>

        {/* Drag hint — shows briefly */}
        {score === 0 && timeLeft > 27 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-[18%] left-0 right-0 text-center"
          >
            <motion.div animate={{ x: [-30, 30, -30] }} transition={{ duration: 2, repeat: Infinity }}>
              <span className="text-3xl">👆</span>
            </motion.div>
            <p className="text-white/40 text-sm mt-1">Slide to catch!</p>
          </motion.div>
        )}
      </div>

      {/* Game Over */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center p-8 z-30">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="bg-slate-900 rounded-3xl p-8 text-center max-w-sm w-full border border-white/10">
              <div className="text-6xl mb-4">{score >= 15 ? '🏆' : '📦'}</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {score >= 15 ? 'Amazing!' : score >= 8 ? 'Great Job!' : 'Nice Try!'}
              </h2>
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-sm text-white/50">Caught</div>
                  <div className="text-3xl font-bold text-green-400">{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-white/50">Missed</div>
                  <div className="text-3xl font-bold text-red-400">{missed}</div>
                </div>
              </div>
              {packingHighScore > 0 && (
                <p className="text-sm text-white/40 mb-4">
                  {score > packingHighScore ? '🎉 NEW HIGH SCORE!' : `Best: ${packingHighScore}`}
                </p>
              )}
              <div className="flex gap-3">
                <motion.button onClick={handlePlayAgain} whileTap={{ scale: 0.95 }}
                  className="flex-1 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-xl touch-manipulation">
                  🔄
                </motion.button>
                <motion.button onClick={() => { soundManager.tap(); onClose(); }} whileTap={{ scale: 0.95 }}
                  className="flex-1 py-5 bg-white/10 text-white rounded-2xl font-bold text-xl touch-manipulation">
                  ✅
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
