'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';

interface Box {
  id: number;
  x: number;
  y: number;
  packed: boolean;
  missed: boolean;
  emoji: string;
}

const boxEmojis = ['📦', '🎁', '📮', '🧸', '🎀', '📦'];

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
  const { setPackingScore, packingHighScore, earnBadge, showAchievement, isMuted } = useGameStore();

  // Spawn new boxes - gets faster as score increases
  useEffect(() => {
    if (gameOver) return;

    const spawnRate = Math.max(800, 1500 - score * 50);
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      const newBox: Box = {
        id,
        x: Math.random() * 70 + 15,
        y: -10,
        packed: false,
        missed: false,
        emoji: boxEmojis[Math.floor(Math.random() * boxEmojis.length)],
      };

      setBoxes(prev => [...prev, newBox]);
    }, spawnRate);

    return () => clearInterval(interval);
  }, [gameOver, score]);

  // Move boxes down
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBoxes(prev => {
        return prev.map(box => {
          if (box.packed || box.missed) return box;

          const newY = box.y + 1.5;

          // Box went off screen
          if (newY > 95) {
            if (!isMuted) soundManager.whoops();
            setCombo(0);
            return { ...box, y: newY, missed: true };
          }

          return { ...box, y: newY };
        }).filter(box => !box.missed && !box.packed || box.y < 110);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [gameOver, isMuted]);

  // Game timer
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setPackingScore(score);
          // Award achievement for 15+ boxes
          if (score >= 15) {
            earnBadge('box-champion');
            setTimeout(() => showAchievement('box-champion'), 500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameOver, score, setPackingScore, earnBadge, showAchievement]);

  // Handle box tap
  const handleBoxTap = useCallback((boxId: number) => {
    setBoxes(prev =>
      prev.map(box => {
        if (box.id === boxId && !box.packed && !box.missed) {
          soundManager.pop();
          setScore(s => s + 1);
          setCombo(c => {
            const newCombo = c + 1;
            if (newCombo > bestCombo) setBestCombo(newCombo);
            if (newCombo >= 3 && newCombo % 3 === 0) {
              setShowComboText(true);
              soundManager.success();
              setTimeout(() => setShowComboText(false), 800);
            }
            return newCombo;
          });
          return { ...box, packed: true };
        }
        return box;
      })
    );
  }, [bestCombo]);

  const handleClose = () => {
    soundManager.tap();
    onClose();
  };

  const handlePlayAgain = () => {
    soundManager.tap();
    setBoxes([]);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setTimeLeft(30);
    setGameOver(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-purple-900 to-purple-950"
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
            <div className="text-sm opacity-70">Score</div>
            <div className="text-2xl font-bold">{score}</div>
          </div>
          {combo >= 2 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="text-sm opacity-70">Combo</div>
              <div className="text-2xl font-bold text-yellow-400">{combo}x</div>
            </motion.div>
          )}
          <div className="text-center">
            <div className="text-sm opacity-70">Time</div>
            <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-400' : ''}`}>
              {timeLeft}s
            </div>
          </div>
        </div>
      </div>

      {/* Combo text overlay */}
      <AnimatePresence>
        {showComboText && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <span className="text-6xl font-bold text-yellow-400 drop-shadow-lg">
              {combo}x COMBO!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game instructions */}
      <div className="absolute top-20 left-0 right-0 text-center text-white">
        <h2 className="text-2xl font-bold mb-1">Tap the Boxes!</h2>
        <p className="text-white/70">Pack as many as you can!</p>
      </div>

      {/* Game area */}
      <div className="absolute inset-0 pt-32 pb-20 overflow-hidden">
        {/* Conveyor belt visual at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-yellow-900 to-yellow-800 border-t-4 border-yellow-600">
          <motion.div
            className="absolute inset-0 flex items-center"
            animate={{ x: [0, -40] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-10 h-4 bg-yellow-700 mx-2 rounded" />
            ))}
          </motion.div>
        </div>

        {/* Boxes */}
        <AnimatePresence>
          {boxes.filter(b => !b.missed).map(box => (
            <motion.button
              key={box.id}
              onClick={() => handleBoxTap(box.id)}
              className="absolute touch-manipulation"
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{
                scale: box.packed ? 0 : 1,
                rotate: box.packed ? 360 : 0,
              }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
              disabled={box.packed}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg shadow-lg border-2 border-amber-400 flex items-center justify-center">
                <span className="text-3xl">{box.emoji}</span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
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
                {score >= 15 ? '🏆' : '📦'}
              </motion.div>

              <h2 className="text-3xl font-bold text-foreground mb-2">
                {score >= 15 ? 'Amazing!' : 'Great Job!'}
              </h2>

              <p className="text-xl text-muted-foreground mb-2">
                You packed
              </p>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-5xl font-bold text-primary mb-2"
              >
                {score}
              </motion.div>

              <p className="text-lg text-muted-foreground mb-1">boxes!</p>

              {bestCombo >= 3 && (
                <p className="text-sm text-yellow-500 font-bold mb-2">
                  Best combo: {bestCombo}x
                </p>
              )}

              {packingHighScore > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                  {score > packingHighScore ? '🎉 New high score!' : `Best: ${packingHighScore}`}
                </p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handlePlayAgain}
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
