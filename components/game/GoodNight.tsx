'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { playLocalAudio, stopElevenLabsSpeech } from '@/lib/voice';
import { useGameStore } from '@/lib/game-state';

interface GoodNightProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoodNight({ isOpen, onClose }: GoodNightProps) {
  const [playing, setPlaying] = useState(false);
  const { isMuted } = useGameStore();

  const handlePlay = () => {
    if (isMuted) return;
    stopElevenLabsSpeech();
    const num = Math.floor(Math.random() * 3) + 1;
    playLocalAudio(`goodnight-${num}`, () => setPlaying(true), () => setPlaying(false));
  };

  const handleClose = () => {
    stopElevenLabsSpeech();
    soundManager.tap();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
        >
          {/* Dark sky background */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950" onClick={handleClose} />

          {/* Stars */}
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{ top: `${Math.random() * 60}%`, left: `${Math.random() * 100}%` }}
              animate={{ opacity: [0.1, 0.7, 0.1] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
            {/* Moon */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-8xl mb-6"
            >
              🌙
            </motion.div>

            <h2 className="text-3xl font-bold text-white mb-2">Good Night, Dad!</h2>
            <p className="text-lg text-white/50 mb-8 text-center">Tap the moon to hear a bedtime message</p>

            {playing && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-cyan-400 mb-6 flex items-center gap-2"
              >
                <div className="flex gap-1">
                  {[0, 0.15, 0.3, 0.15].map((d, i) => (
                    <motion.div key={i} animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 0.5, repeat: Infinity, delay: d }}
                      className="w-1 h-3 bg-cyan-400 rounded-full" />
                  ))}
                </div>
                <span className="text-sm">Eric is saying good night...</span>
              </motion.div>
            )}

            <motion.button
              onClick={handlePlay}
              disabled={playing}
              className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xl rounded-full shadow-2xl touch-manipulation disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
              animate={!playing ? {
                boxShadow: ['0 0 20px rgba(99,102,241,0.3)', '0 0 40px rgba(99,102,241,0.6)', '0 0 20px rgba(99,102,241,0.3)'],
              } : {}}
              transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
            >
              {playing ? '🌙 Listening...' : '🌙 Good Night!'}
            </motion.button>

            <button onClick={handleClose} className="mt-8 text-sm text-white/30 touch-manipulation">
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
