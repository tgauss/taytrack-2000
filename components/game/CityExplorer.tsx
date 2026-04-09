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
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.3 }}
        className="absolute bottom-[68px] left-3 right-3 z-30"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xl"
              >
                🔍
              </motion.span>
              <span className="text-sm font-bold text-white/80">
                Explore this city!
              </span>
            </div>
            <span className="text-xs text-white/30">{pois.length} places</span>
          </div>

          {/* Scrollable cards — bigger for iPad fingers */}
          <div
            className="flex gap-2.5 overflow-x-auto px-3 pb-3 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {pois.map((poi, i) => {
              const isActive = activePOIId === poi.id;
              return (
                <motion.button
                  key={poi.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                  onClick={() => { soundManager.tap(); onSelectPOI(poi); }}
                  className="flex-shrink-0 snap-center rounded-xl overflow-hidden touch-manipulation transition-all active:scale-95"
                  style={{
                    width: '130px',
                    minWidth: '130px',
                    background: isActive
                      ? `linear-gradient(135deg, ${poi.color}30, ${poi.color}15)`
                      : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${isActive ? poi.color : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: isActive ? `0 0 16px ${poi.color}33` : 'none',
                  }}
                >
                  {/* Image thumbnail */}
                  {poi.imageUrl && (
                    <div className="w-full h-[60px] overflow-hidden relative">
                      <img src={poi.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-1 right-1 text-xl drop-shadow-lg">{poi.emoji}</span>
                    </div>
                  )}
                  {!poi.imageUrl && (
                    <div className="w-full h-[60px] flex items-center justify-center bg-white/5">
                      <span className="text-3xl">{poi.emoji}</span>
                    </div>
                  )}

                  {/* Label */}
                  <div className="px-2 py-2">
                    <p
                      className="text-[11px] font-bold leading-tight text-center line-clamp-2"
                      style={{ color: isActive ? poi.color : 'rgba(255,255,255,0.7)' }}
                    >
                      {poi.name}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
