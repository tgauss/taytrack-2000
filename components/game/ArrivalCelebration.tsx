'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ArrivalCelebrationProps {
  cityName: string | null;
  cityEmoji?: string;
}

const CONFETTI_COLORS = ['#ff6b9d', '#ffd93d', '#4ade80', '#60a5fa', '#a855f7', '#f97316', '#ec4899', '#00d4aa'];

export function ArrivalCelebration({ cityName, cityEmoji }: ArrivalCelebrationProps) {
  if (!cityName) return null;

  return (
    <AnimatePresence>
      {cityName && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center"
        >
          {/* Confetti explosion */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 80 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  width: `${Math.random() * 14 + 6}px`,
                  height: `${Math.random() * 14 + 6}px`,
                  left: `${40 + Math.random() * 20}%`,
                  top: '50%',
                }}
                animate={{
                  x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 600],
                  y: [0, (Math.random() - 0.5) * 600],
                  scale: [0, 1.5, 0],
                  rotate: [0, 720 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2.5,
                  delay: Math.random() * 0.4,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* City name splash */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3, times: [0, 0.3, 0.7, 1] }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: 3 }}
              className="text-7xl mb-4"
            >
              {cityEmoji || '🎉'}
            </motion.div>
            <h1 className="text-5xl font-bold text-white drop-shadow-2xl">
              {cityName}!
            </h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
