'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { playLocalAudio, stopElevenLabsSpeech } from '@/lib/voice';
import { useGameStore } from '@/lib/game-state';

export function SendHug() {
  const [showHeart, setShowHeart] = useState(false);
  const { isMuted } = useGameStore();

  const handleHug = () => {
    soundManager.fanfare();
    setShowHeart(true);

    if (!isMuted) {
      stopElevenLabsSpeech();
      const hugNum = Math.floor(Math.random() * 3) + 1;
      playLocalAudio(`hug-${hugNum}`);
    }

    setTimeout(() => setShowHeart(false), 4000);
  };

  return (
    <>
      {/* Hug button — always visible in bottom-left */}
      <motion.button
        onClick={handleHug}
        className="absolute bottom-[72px] left-3 z-30 w-14 h-14 bg-pink-500/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-pink-400/30 touch-manipulation"
        whileTap={{ scale: 0.85 }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ scale: { duration: 2, repeat: Infinity } }}
      >
        <span className="text-2xl">💕</span>
      </motion.button>

      {/* Heart explosion overlay */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] pointer-events-none flex items-center justify-center"
          >
            {/* Flying hearts */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl"
                style={{ left: `${30 + Math.random() * 40}%`, top: '50%' }}
                animate={{
                  x: (Math.random() - 0.5) * 500,
                  y: (Math.random() - 0.5) * 500,
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 2, delay: Math.random() * 0.3, ease: 'easeOut' }}
              >
                {['❤️', '💕', '💗', '💖', '🥰'][i % 5]}
              </motion.div>
            ))}

            {/* Big center heart */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 2, 1.5] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 8 }}
              className="text-9xl"
            >
              💕
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
