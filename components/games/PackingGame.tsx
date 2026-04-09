'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';

// Box types with different point values and images
const BOX_TYPES = [
  { image: '/game-assets/box-cardboard.png', points: 1, name: 'box' },
  { image: '/game-assets/box-cardboard.png', points: 1, name: 'box' },
  { image: '/game-assets/box-gift.png', points: 2, name: 'gift' },
  { image: '/game-assets/box-treasure.png', points: 3, name: 'treasure' },
  { image: '/game-assets/box-special.png', points: 5, name: 'special' },
];

interface Box {
  id: number;
  x: number;
  y: number;
  packed: boolean;
  missed: boolean;
  type: typeof BOX_TYPES[number];
}

interface PackingGameProps {
  onClose: () => void;
}

export function PackingGame({ onClose }: PackingGameProps) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showComboText, setShowComboText] = useState(false);
  const [boxesPacked, setBoxesPacked] = useState(0);
  const { setPackingScore, packingHighScore, earnBadge, showAchievement } = useGameStore();

  // Spawn boxes — gets faster as score increases
  useEffect(() => {
    if (gameOver) return;
    const spawnRate = Math.max(700, 1400 - boxesPacked * 40);
    const interval = setInterval(() => {
      const typeIdx = Math.random() < 0.15 ? 4 : Math.random() < 0.25 ? 3 : Math.random() < 0.4 ? 2 : Math.random() < 0.7 ? 1 : 0;
      const type = BOX_TYPES[Math.min(typeIdx, BOX_TYPES.length - 1)];
      const newBox: Box = {
        id: Date.now() + Math.random(),
        x: Math.random() * 70 + 15,
        y: -12,
        packed: false,
        missed: false,
        type,
      };
      setBoxes(prev => [...prev, newBox]);
    }, spawnRate);
    return () => clearInterval(interval);
  }, [gameOver, boxesPacked]);

  // Move boxes down
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setBoxes(prev => prev.map(box => {
        if (box.packed || box.missed) return box;
        const newY = box.y + 1.5;
        if (newY > 92) {
          soundManager.whoops();
          setCombo(0);
          return { ...box, y: newY, missed: true };
        }
        return { ...box, y: newY };
      }).filter(box => !(box.missed || box.packed) || box.y < 105));
    }, 70);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setPackingScore(score);
          if (score >= 30) { earnBadge('box-champion'); setTimeout(() => showAchievement('box-champion'), 500); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, score, setPackingScore, earnBadge, showAchievement]);

  const handleBoxTap = useCallback((boxId: number) => {
    setBoxes(prev => prev.map(box => {
      if (box.id === boxId && !box.packed && !box.missed) {
        soundManager.pop();
        setScore(s => s + box.type.points);
        setBoxesPacked(b => b + 1);
        setCombo(c => {
          const nc = c + 1;
          if (nc > bestCombo) setBestCombo(nc);
          if (nc >= 3 && nc % 3 === 0) {
            setShowComboText(true);
            soundManager.success();
            setTimeout(() => setShowComboText(false), 800);
          }
          return nc;
        });
        return { ...box, packed: true };
      }
      return box;
    }));
  }, [bestCombo]);

  const handlePlayAgain = () => {
    soundManager.tap();
    setBoxes([]); setScore(0); setCombo(0); setBestCombo(0);
    setBoxesPacked(0); setTimeLeft(30); setGameOver(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-900 via-purple-900 to-purple-950">

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-black/30">
        <button onClick={() => { soundManager.tap(); onClose(); }}
          className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl touch-manipulation">
          ←
        </button>
        <div className="flex gap-6 text-white">
          <div className="text-center">
            <div className="text-xs opacity-60">Score</div>
            <div className="text-2xl font-bold">{score}</div>
          </div>
          {combo >= 2 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
              <div className="text-xs opacity-60">Combo</div>
              <div className="text-2xl font-bold text-yellow-400">{combo}x</div>
            </motion.div>
          )}
          <div className="text-center">
            <div className="text-xs opacity-60">Boxes</div>
            <div className="text-2xl font-bold">{boxesPacked}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-60">Time</div>
            <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-400' : ''}`}>{timeLeft}s</div>
          </div>
        </div>
      </div>

      {/* Dad cheering */}
      <div className="absolute top-16 left-4 z-5">
        <img src="/game-assets/dad-packing.png" alt="" className="w-24 h-24 object-contain opacity-60" />
      </div>

      {/* Combo text */}
      <AnimatePresence>
        {showComboText && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1.5 }} exit={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <span className="text-6xl font-bold text-yellow-400 drop-shadow-lg">{combo}x COMBO!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game area */}
      <div className="absolute inset-0 pt-20 pb-4 overflow-hidden">
        {/* Conveyor belt */}
        <div className="absolute bottom-0 left-0 right-0 h-16">
          <img src="/game-assets/conveyor-belt.png" alt="" className="w-full h-full object-cover opacity-70" />
        </div>

        {/* Boxes */}
        <AnimatePresence>
          {boxes.filter(b => !b.missed).map(box => (
            <motion.button
              key={box.id}
              onClick={() => handleBoxTap(box.id)}
              className="absolute touch-manipulation"
              style={{ left: `${box.x}%`, top: `${box.y}%`, transform: 'translate(-50%, -50%)' }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: box.packed ? 0 : 1, rotate: box.packed ? 360 : 0 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
              disabled={box.packed}
            >
              <div className="relative">
                <img src={box.type.image} alt="" className="w-20 h-20 object-contain drop-shadow-lg" />
                {box.type.points > 1 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    +{box.type.points}
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Game Over */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center p-8 z-30">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="bg-slate-900 rounded-3xl p-8 text-center max-w-sm w-full border border-white/10">
              <img src="/game-assets/dad-packing.png" alt="" className="w-24 h-24 object-contain mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">
                {score >= 30 ? 'AMAZING!' : score >= 15 ? 'Great Job!' : 'Nice Try!'}
              </h2>
              <div className="flex justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className="text-sm text-white/50">Score</div>
                  <div className="text-3xl font-bold text-cyan-400">{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-white/50">Boxes</div>
                  <div className="text-3xl font-bold text-purple-400">{boxesPacked}</div>
                </div>
              </div>
              {bestCombo >= 3 && <p className="text-sm text-yellow-400 font-bold mb-2">Best combo: {bestCombo}x</p>}
              {packingHighScore > 0 && (
                <p className="text-sm text-white/40 mb-4">
                  {score > packingHighScore ? '🎉 NEW HIGH SCORE!' : `Best: ${packingHighScore}`}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={handlePlayAgain}
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
