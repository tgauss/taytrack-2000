'use client';

import { motion } from 'framer-motion';
import { useGameStore, type GameLocation } from '@/lib/game-state';
import { cityData } from '@/lib/fun-facts';

const allStops: { id: GameLocation; emoji: string; name: string }[] = [
  { id: 'vancouver', emoji: '🏠', name: 'Home' },
  { id: 'seattle', emoji: '☕', name: 'Seattle' },
  { id: 'tulsa', emoji: '🤠', name: 'Tulsa' },
  { id: 'lincoln', emoji: '🌽', name: 'Lincoln' },
  { id: 'roca', emoji: '📦', name: 'Roca' },
  { id: 'omaha', emoji: '✈️', name: 'Omaha' },
  { id: 'vancouver-return', emoji: '🏠', name: 'Home!' },
];

export function ProgressCaterpillar() {
  const { visitedLocations, currentLocation } = useGameStore();

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10">
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-3 border border-border">
        {/* Label */}
        <div className="text-xs text-muted-foreground font-medium mb-2 text-center">
          Dad&apos;s Journey
        </div>

        {/* Progress track */}
        <div className="relative flex items-center justify-between">
          {/* Connection line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
              initial={{ width: '0%' }}
              animate={{
                width: `${(visitedLocations.length / allStops.length) * 100}%`
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Stop markers */}
          {allStops.map((stop, index) => {
            const isVisited = visitedLocations.includes(stop.id);
            const isCurrent = currentLocation === stop.id;
            const city = cityData.find(c => c.id === stop.id || (stop.id === 'vancouver-return' && c.id === 'vancouver'));

            return (
              <motion.div
                key={stop.id}
                className="relative z-10 flex flex-col items-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Marker */}
                <motion.div
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-md"
                  style={{
                    backgroundColor: isVisited
                      ? (city?.color || '#22c55e')
                      : '#374151',
                    borderColor: isCurrent ? '#fff' : isVisited ? '#fff' : '#6b7280',
                  }}
                  animate={isCurrent ? {
                    scale: [1, 1.2, 1],
                    boxShadow: ['0 0 0 0 rgba(255,255,255,0)', '0 0 0 8px rgba(255,255,255,0.3)', '0 0 0 0 rgba(255,255,255,0)'],
                  } : {}}
                  transition={{
                    duration: 1.5,
                    repeat: isCurrent ? Infinity : 0,
                  }}
                >
                  <span className="text-lg">{stop.emoji}</span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
