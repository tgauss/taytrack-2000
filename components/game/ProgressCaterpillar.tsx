'use client';

import { motion } from 'framer-motion';
import { useGameStore, type GameLocation } from '@/lib/game-state';
import { cityData } from '@/lib/fun-facts';
import { soundManager } from '@/lib/sounds';

const allStops: { id: GameLocation; emoji: string; name: string }[] = [
  { id: 'vancouver', emoji: '🏠', name: 'Home' },
  { id: 'seattle', emoji: '☕', name: 'Seattle' },
  { id: 'tulsa', emoji: '🤠', name: 'Tulsa' },
  { id: 'lincoln', emoji: '🌽', name: 'Lincoln' },
  { id: 'roca', emoji: '📦', name: 'Roca' },
  { id: 'omaha', emoji: '✈️', name: 'Omaha' },
  { id: 'vancouver-return', emoji: '🏠', name: 'Home!' },
];

interface ProgressCaterpillarProps {
  onCityTap?: (cityId: GameLocation) => void;
}

export function ProgressCaterpillar({ onCityTap }: ProgressCaterpillarProps) {
  const { visitedLocations, currentLocation } = useGameStore();

  return (
    <div className="absolute bottom-3 left-3 right-3 z-10">
      <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 border border-white/10">
        {/* Progress track */}
        <div className="relative flex items-center justify-between">
          {/* Connection line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
              initial={{ width: '0%' }}
              animate={{ width: `${(visitedLocations.length / allStops.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Stop markers */}
          {allStops.map((stop, index) => {
            const isVisited = visitedLocations.includes(stop.id);
            const isCurrent = currentLocation === stop.id;
            const city = cityData.find(c => c.id === stop.id || (stop.id === 'vancouver-return' && c.id === 'vancouver'));
            const canTap = isVisited && onCityTap;

            return (
              <motion.button
                key={stop.id}
                className="relative z-10 flex flex-col items-center touch-manipulation"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => {
                  if (canTap) {
                    soundManager.tap();
                    onCityTap(stop.id);
                  }
                }}
                disabled={!canTap}
              >
                <motion.div
                  className="w-11 h-11 rounded-full flex items-center justify-center border-2 shadow-md"
                  style={{
                    backgroundColor: isVisited ? (city?.color || '#22c55e') : 'rgba(55,65,81,0.8)',
                    borderColor: isCurrent ? '#fff' : isVisited ? 'rgba(255,255,255,0.6)' : 'rgba(107,114,128,0.5)',
                    opacity: isVisited ? 1 : 0.4,
                  }}
                  animate={isCurrent ? {
                    scale: [1, 1.15, 1],
                    boxShadow: ['0 0 0 0 rgba(255,255,255,0)', '0 0 0 6px rgba(255,255,255,0.2)', '0 0 0 0 rgba(255,255,255,0)'],
                  } : {}}
                  transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0 }}
                  whileTap={canTap ? { scale: 0.85 } : {}}
                >
                  <span className="text-lg">{isVisited ? stop.emoji : '🔒'}</span>
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
