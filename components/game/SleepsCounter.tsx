'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSleepsUntilHome } from '@/lib/daily-journal';

export function SleepsCounter() {
  const [sleeps, setSleeps] = useState<number | null>(null);

  useEffect(() => {
    setSleeps(getSleepsUntilHome());
  }, []);

  if (sleeps === null) return null;

  // Trip hasn't started yet or is over
  const tripStart = new Date('2026-04-12T00:00:00');
  const tripEnd = new Date('2026-04-19T23:59:59');
  const now = new Date();

  if (now < tripStart || now > tripEnd) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
    >
      <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm rounded-full px-6 py-2 border border-white/20 shadow-lg">
        <div className="flex items-center gap-2 text-white">
          {sleeps === 0 ? (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="font-bold text-lg"
            >
              🏠 Dad comes home TODAY!
            </motion.span>
          ) : (
            <>
              <span className="text-2xl">😴</span>
              <span className="font-bold text-lg">
                {sleeps} sleep{sleeps !== 1 ? 's' : ''} until Dad&apos;s home!
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
