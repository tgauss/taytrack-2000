'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { getPOIsForCity, type POI } from '@/lib/poi-data';

interface CityExplorerProps {
  cityId: string | null;
  onSelectPOI: (poi: POI) => void;
  activePOIId: string | null;
}

export function CityExplorer({ cityId, onSelectPOI, activePOIId }: CityExplorerProps) {
  if (!cityId) return null;

  const pois = getPOIsForCity(cityId);
  if (pois.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={cityId}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.3 }}
        className="absolute bottom-[190px] left-4 right-4 z-30"
      >
        <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-2xl p-3">
          {/* Header */}
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Tap to explore!
            </span>
          </div>

          {/* Scrollable landmark cards */}
          <div className="flex gap-3 overflow-x-auto pb-1 px-1 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {pois.map((poi, i) => {
              const isActive = activePOIId === poi.id;
              return (
                <motion.button
                  key={poi.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  onClick={() => {
                    soundManager.tap();
                    onSelectPOI(poi);
                  }}
                  className={`flex-shrink-0 snap-center rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all touch-manipulation ${
                    isActive
                      ? 'ring-2 ring-offset-2 ring-offset-card'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${poi.color}44, ${poi.color}22)`
                      : 'rgba(255,255,255,0.05)',
                    width: '100px',
                    minWidth: '100px',
                    borderColor: isActive ? poi.color : 'transparent',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    ringColor: poi.color,
                  }}
                  whileTap={{ scale: 0.92 }}
                >
                  <motion.span
                    className="text-3xl"
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {poi.emoji}
                  </motion.span>
                  <span
                    className="text-[10px] font-bold leading-tight text-center line-clamp-2"
                    style={{ color: poi.color }}
                  >
                    {poi.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
