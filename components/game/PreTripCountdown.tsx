'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playLocalAudio, stopElevenLabsSpeech, unlockAudio } from '@/lib/voice';
import { useGameStore } from '@/lib/game-state';
import Link from 'next/link';

export function PreTripCountdown() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isMuted } = useGameStore();

  useEffect(() => {
    const tripStart = new Date('2026-04-12T00:00:00');
    const now = new Date();
    if (now >= tripStart) {
      setDaysLeft(null);
      return;
    }
    const diff = Math.ceil((tripStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    setDaysLeft(diff);
  }, []);

  // null = trip has started, don't show countdown
  if (daysLeft === null) return null;

  const handleListen = () => {
    unlockAudio(); // Unlock audio on iOS with this user gesture
    if (isMuted) return;
    stopElevenLabsSpeech();
    const key = daysLeft === 0 ? 'countdown-today' : `countdown-${Math.min(daysLeft, 4)}`;
    playLocalAudio(key, () => setIsSpeaking(true), () => setIsSpeaking(false));
  };

  const emojis = ['✈️', '🚗', '📦', '🤠', '🌽', '🏠'];

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="text-center px-8 max-w-lg">
        {/* Bouncing airplane */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-8xl mb-6"
        >
          ✈️
        </motion.div>

        {/* Countdown number */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          {daysLeft === 0 ? (
            <h1 className="text-5xl font-bold text-white mb-2">TODAY!</h1>
          ) : (
            <>
              <div className="text-8xl font-bold text-yellow-400 mb-2">{daysLeft}</div>
              <h1 className="text-3xl font-bold text-white mb-2">
                day{daysLeft !== 1 ? 's' : ''} until
              </h1>
              <h2 className="text-2xl text-white/80">Dad&apos;s Big Adventure!</h2>
            </>
          )}
        </motion.div>

        <p className="text-lg text-white/60 mt-4 mb-8">
          {daysLeft === 0
            ? "Dad is heading to the airport RIGHT NOW!"
            : daysLeft === 1
              ? "Make sure to give Dad the biggest hugs tonight!"
              : "He's going to fly to Oklahoma, drive through Kansas, and pack hundreds of boxes!"
          }
        </p>

        {/* Listen button */}
        <motion.button
          onClick={handleListen}
          disabled={isSpeaking}
          className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xl rounded-full shadow-2xl touch-manipulation mb-6 disabled:opacity-50"
          whileTap={{ scale: 0.95 }}
          animate={!isSpeaking ? {
            boxShadow: ['0 0 20px rgba(6,182,212,0.3)', '0 0 50px rgba(6,182,212,0.6)', '0 0 20px rgba(6,182,212,0.3)'],
          } : {}}
          transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
        >
          {isSpeaking ? '🔊 Listening...' : '🔊 Tell Me!'}
        </motion.button>

        {/* Dancing emojis */}
        <div className="flex justify-center gap-3 mb-8">
          {emojis.map((e, i) => (
            <motion.span
              key={i}
              className="text-3xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            >
              {e}
            </motion.span>
          ))}
        </div>

        {/* Link to main page */}
        <Link href="/" className="text-sm text-white/40 hover:text-white/60">
          Go to main dashboard →
        </Link>
      </div>
    </div>
  );
}
