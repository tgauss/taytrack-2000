'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';
import { playPOIAudio, stopElevenLabsSpeech } from '@/lib/voice';
import { getPOIsForCity } from '@/lib/poi-data';
import type { POI } from '@/lib/poi-data';

interface LandmarkExplorerProps {
  poi: POI | null;
  onClose: () => void;
  onNextPOI?: (poi: POI) => void;
}

export function LandmarkExplorer({ poi, onClose, onNextPOI }: LandmarkExplorerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const { isMuted, markPOIVisited, visitedPOIs } = useGameStore();

  // Mark POI as visited and auto-play narration
  useEffect(() => {
    if (!poi) return;
    markPOIVisited(poi.id);
    stopElevenLabsSpeech();
    setIsSpeaking(false);
    setShowNudge(false);

    if (!isMuted) {
      const t = setTimeout(() => {
        playPOIAudio(poi.id, () => setIsSpeaking(true), () => {
          setIsSpeaking(false);
          // After narration finishes, nudge to next POI
          setTimeout(() => setShowNudge(true), 1500);
        });
      }, 500);
      return () => { clearTimeout(t); stopElevenLabsSpeech(); };
    } else {
      setTimeout(() => setShowNudge(true), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi?.id, isMuted]);

  const handlePlay = () => {
    if (!poi || isMuted) return;
    stopElevenLabsSpeech();
    setShowNudge(false);
    playPOIAudio(poi.id, () => setIsSpeaking(true), () => {
      setIsSpeaking(false);
      setTimeout(() => setShowNudge(true), 1500);
    });
  };

  const handleClose = () => {
    stopElevenLabsSpeech();
    soundManager.tap();
    onClose();
  };

  // Find next unvisited POI in the same city
  const getNextPOI = (): POI | null => {
    if (!poi) return null;
    const cityPOIs = getPOIsForCity(poi.cityId);
    const unvisited = cityPOIs.filter(p => !visitedPOIs.includes(p.id) && p.id !== poi.id);
    return unvisited[0] || null;
  };

  const handleNext = () => {
    const next = getNextPOI();
    if (next && onNextPOI) {
      soundManager.tap();
      stopElevenLabsSpeech();
      onNextPOI(next);
    } else {
      handleClose();
    }
  };

  if (!poi) return null;

  const nextPOI = getNextPOI();
  const cityPOIs = getPOIsForCity(poi.cityId);
  const visitedCount = cityPOIs.filter(p => visitedPOIs.includes(p.id)).length;

  return (
    <AnimatePresence>
      {poi && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 250 }}
          className="fixed bottom-0 left-0 right-0 h-[50vh] z-[80] flex flex-col"
        >
          <div className="bg-slate-900/98 backdrop-blur-xl rounded-t-[24px] flex flex-col h-full border-t border-white/10 shadow-2xl">

            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header — emoji, name, progress dots */}
            <div className="px-4 pb-2 flex items-center gap-3">
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                {poi.emoji}
              </motion.span>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{poi.name}</h2>
                {/* Progress: visited dots */}
                <div className="flex gap-1 mt-1">
                  {cityPOIs.map(p => (
                    <div
                      key={p.id}
                      className={`w-2 h-2 rounded-full ${
                        p.id === poi.id ? 'bg-cyan-400' : visitedPOIs.includes(p.id) ? 'bg-cyan-400/40' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* Listening indicator */}
              {isSpeaking && (
                <div className="flex gap-0.5">
                  {[0, 0.12, 0.24, 0.12].map((d, i) => (
                    <motion.div key={i} animate={{ scaleY: [1, 2.5, 1] }}
                      transition={{ duration: 0.4, repeat: Infinity, delay: d }}
                      className="w-1 h-3 bg-cyan-400 rounded-full" />
                  ))}
                </div>
              )}
            </div>

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">
              {/* Image */}
              {poi.imageUrl && (
                <div className="rounded-xl overflow-hidden bg-slate-800">
                  <img src={poi.imageUrl} alt={poi.name} className="w-full max-h-[18vh] object-contain" />
                </div>
              )}

              {/* Story text */}
              <p className="text-base leading-relaxed text-white/85">{poi.historyLesson}</p>

              {/* Did You Know */}
              {poi.didYouKnow && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <p className="text-sm text-white/70">{poi.didYouKnow}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom bar — BIG icon buttons only, no text */}
            <div className="px-4 pb-4 pt-2 border-t border-white/5 flex gap-3">
              {/* Replay */}
              <motion.button
                onClick={handlePlay}
                disabled={isSpeaking}
                className="w-16 h-16 bg-cyan-500/20 border-2 border-cyan-500/30 rounded-2xl flex items-center justify-center text-3xl touch-manipulation disabled:opacity-40"
                whileTap={{ scale: 0.9 }}
              >
                🔊
              </motion.button>

              {/* Next POI / Done */}
              <motion.button
                onClick={handleNext}
                className={`flex-1 h-16 rounded-2xl font-bold text-xl touch-manipulation flex items-center justify-center gap-2 ${
                  nextPOI
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                }`}
                whileTap={{ scale: 0.96 }}
                animate={showNudge && !isSpeaking ? {
                  scale: [1, 1.04, 1],
                  boxShadow: ['0 0 20px rgba(6,182,212,0.3)', '0 0 40px rgba(6,182,212,0.6)', '0 0 20px rgba(6,182,212,0.3)'],
                } : {}}
                transition={{ scale: { duration: 1.5, repeat: Infinity }, boxShadow: { duration: 1.5, repeat: Infinity } }}
              >
                {nextPOI ? (
                  <><span className="text-2xl">{nextPOI.emoji}</span> ▶️</>
                ) : (
                  <>✅ 🗺️</>
                )}
              </motion.button>

              {/* Close */}
              <motion.button
                onClick={handleClose}
                className="w-16 h-16 bg-white/5 border-2 border-white/10 rounded-2xl flex items-center justify-center text-2xl touch-manipulation"
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>

            {/* Nudge text — only after narration finishes */}
            <AnimatePresence>
              {showNudge && nextPOI && !isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center pb-2"
                >
                  <p className="text-xs text-white/30">{visitedCount} of {cityPOIs.length} explored</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
