'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';

const ITEMS = ['🌽', '⚙️', '🪑', '🏈', '🧸', '👢', '🎒', '🧢', '🌻', '🔩', '🪵', '🧤'];

interface FallingItem {
  id: number;
  emoji: string;
  x: number;
  y: number;
  speed: number;
  caught: boolean;
  missed: boolean;
}

interface PackingGameProps {
  onClose: () => void;
}

export function PackingGame({ onClose }: PackingGameProps) {
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [catchEffect, setCatchEffect] = useState<{ x: number; y: number; id: number } | null>(null);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxXRef = useRef(50);
  const itemsRef = useRef<FallingItem[]>([]);
  const scoreRef = useRef(0);
  const missedRef = useRef(0);
  const gameOverRef = useRef(false);
  const lastSpawnRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const { setPackingScore, packingHighScore, earnBadge, showAchievement } = useGameStore();

  // Game loop — uses canvas for zero-lag rendering
  const gameLoop = useCallback((timestamp: number) => {
    if (gameOverRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) { animFrameRef.current = requestAnimationFrame(gameLoop); return; }

    const w = canvas.width;
    const h = canvas.height;

    // Spawn new items — one at a time, every 2.5-3.5 seconds
    const spawnRate = Math.max(2000, 3500 - scoreRef.current * 50);
    if (timestamp - lastSpawnRef.current > spawnRate) {
      // Only spawn if fewer than 3 items on screen
      const activeCount = itemsRef.current.filter(i => !i.caught && !i.missed).length;
      if (activeCount < 3) {
        itemsRef.current.push({
          id: timestamp,
          emoji: ITEMS[Math.floor(Math.random() * ITEMS.length)],
          x: 15 + Math.random() * 70,
          y: -5,
          speed: 0.25 + Math.random() * 0.12,
          caught: false,
          missed: false,
        });
        lastSpawnRef.current = timestamp;
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Update and draw items
    const boxX = boxXRef.current;
    const boxLeft = boxX - 12;
    const boxRight = boxX + 12;

    itemsRef.current = itemsRef.current.filter(item => {
      if (item.caught || item.missed) return false;

      item.y += item.speed;

      // Check catch
      if (item.y >= 80 && item.y <= 92) {
        if (item.x >= boxLeft && item.x <= boxRight) {
          item.caught = true;
          scoreRef.current++;
          setScore(scoreRef.current);
          soundManager.pop();
          setCatchEffect({ x: item.x, y: item.y, id: item.id });
          setTimeout(() => setCatchEffect(null), 400);
          return false;
        }
      }

      // Missed
      if (item.y > 100) {
        item.missed = true;
        missedRef.current++;
        setMissed(missedRef.current);
        return false;
      }

      // Draw item
      const px = (item.x / 100) * w;
      const py = (item.y / 100) * h;
      ctx.font = `${Math.round(w * 0.08)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji, px, py);

      return true;
    });

    // Draw box
    const boxPx = (boxX / 100) * w;
    const boxPy = h * 0.88;
    ctx.font = `${Math.round(w * 0.12)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📦', boxPx, boxPy);

    // Draw catch zone indicator
    ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
    ctx.fillRect((boxLeft / 100) * w, h * 0.82, ((boxRight - boxLeft) / 100) * w, h * 0.12);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Start game loop
  useEffect(() => {
    if (gameOver) return;
    gameOverRef.current = false;
    lastSpawnRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameOver, gameLoop]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current && gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width * 2; // 2x for retina
        canvasRef.current.height = rect.height * 2;
        canvasRef.current.style.width = `${rect.width}px`;
        canvasRef.current.style.height = `${rect.height}px`;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          gameOverRef.current = true;
          setGameOver(true);
          setPackingScore(scoreRef.current);
          if (scoreRef.current >= 10) { earnBadge('box-champion'); setTimeout(() => showAchievement('box-champion'), 500); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, setPackingScore, earnBadge, showAchievement]);

  // Touch/mouse — move box (directly update ref, no state)
  const handleMove = useCallback((clientX: number) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    boxXRef.current = Math.max(12, Math.min(88, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const handlePlayAgain = () => {
    soundManager.tap();
    itemsRef.current = [];
    scoreRef.current = 0; missedRef.current = 0;
    setScore(0); setMissed(0); setTimeLeft(30);
    setGameOver(false); boxXRef.current = 50;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 select-none"
      style={{ background: '#1a1a3e' }}>
      {/* Warehouse background (behind everything) */}
      <div className="absolute inset-0 z-0">
        <img src="/game-assets/warehouse-bg.webp" alt="" className="w-full h-full object-cover" />
      </div>

      {/* Header — above background */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/30">
        <button onClick={() => { soundManager.tap(); onClose(); }}
          className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl touch-manipulation">✕</button>
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

      {/* Game canvas — above background */}
      <div
        ref={gameAreaRef}
        className="absolute inset-0 pt-20 z-10"
        onTouchMove={(e) => { e.preventDefault(); handleMove(e.touches[0].clientX); }}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseDown={(e) => handleMove(e.clientX)}
        style={{ touchAction: 'none' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Catch star effect */}
        <AnimatePresence>
          {catchEffect && (
            <motion.div
              key={catchEffect.id}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute text-4xl pointer-events-none"
              style={{ left: `${catchEffect.x}%`, top: `${catchEffect.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              ⭐
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag hint */}
        {score === 0 && missed === 0 && timeLeft > 27 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute bottom-[22%] left-0 right-0 text-center pointer-events-none">
            <motion.div animate={{ x: [-40, 40, -40] }} transition={{ duration: 2, repeat: Infinity }}>
              <span className="text-4xl">👆</span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Game Over */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center p-8 z-40">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="bg-slate-900 rounded-3xl p-8 text-center max-w-sm w-full border border-white/10">
              <div className="text-6xl mb-4">{score >= 10 ? '🏆' : '📦'}</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {score >= 10 ? 'Amazing!' : score >= 5 ? 'Great Job!' : 'Nice Try!'}
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
                  className="flex-1 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold text-2xl touch-manipulation">🔄</motion.button>
                <motion.button onClick={() => { soundManager.tap(); onClose(); }} whileTap={{ scale: 0.95 }}
                  className="flex-1 py-5 bg-white/10 text-white rounded-2xl font-bold text-2xl touch-manipulation">✅</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
