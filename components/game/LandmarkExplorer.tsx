'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';
import { playPOIAudio, stopElevenLabsSpeech } from '@/lib/voice';
import type { POI } from '@/lib/poi-data';

interface LandmarkExplorerProps {
  poi: POI | null;
  onClose: () => void;
}

export function LandmarkExplorer({ poi, onClose }: LandmarkExplorerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isMuted } = useGameStore();

  // Auto-play narration when a POI opens
  useEffect(() => {
    if (!poi || isMuted) return;
    stopElevenLabsSpeech();
    setIsSpeaking(false);
    const t = setTimeout(() => {
      playPOIAudio(poi.id, () => setIsSpeaking(true), () => setIsSpeaking(false));
    }, 500);
    return () => { clearTimeout(t); stopElevenLabsSpeech(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi?.id, isMuted]);

  const handlePlay = () => {
    if (!poi || isMuted) return;
    stopElevenLabsSpeech();
    playPOIAudio(poi.id, () => setIsSpeaking(true), () => setIsSpeaking(false));
  };

  const handleClose = () => {
    stopElevenLabsSpeech();
    soundManager.tap();
    onClose();
  };

  if (!poi) return null;

  return (
    <AnimatePresence>
      {poi && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="absolute bottom-0 left-0 right-0 max-h-[90vh] flex flex-col"
          >
            <div className="bg-slate-900 rounded-t-[28px] flex flex-col overflow-hidden border-t border-white/10 shadow-2xl">

              {/* Hero image — full, no cropping */}
              <div className="relative">
                {poi.imageUrl && (
                  <div className="w-full bg-slate-800">
                    <img
                      src={poi.imageUrl}
                      alt={poi.name}
                      className="w-full max-h-[35vh] object-contain"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 to-transparent" />
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-11 h-11 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xl touch-manipulation"
                >
                  ✕
                </button>

                {/* Title overlay on image */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end gap-3">
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-5xl drop-shadow-lg"
                    >
                      {poi.emoji}
                    </motion.span>
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg leading-tight flex-1">
                      {poi.name}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Listening indicator */}
              {isSpeaking && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="mx-5 mt-4 flex items-center gap-2 text-cyan-400"
                >
                  <div className="flex gap-1">
                    {[0, 0.15, 0.3, 0.15].map((delay, i) => (
                      <motion.div
                        key={i}
                        animate={{ scaleY: [1, 2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay }}
                        className="w-1 h-3 bg-cyan-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">Eric is telling the story...</span>
                </motion.div>
              )}

              {/* Scrollable content — one smooth flow */}
              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-4" style={{ maxHeight: '40vh' }}>
                {/* Main story text */}
                <p className="text-lg leading-relaxed text-white/85">
                  {poi.historyLesson}
                </p>

                {/* Did You Know callout */}
                {poi.didYouKnow && (
                  <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">💡</span>
                      <div>
                        <span className="text-xs font-bold text-amber-400 uppercase">Did You Know?</span>
                        <p className="text-base text-white/75 mt-1">{poi.didYouKnow}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom bar with big listen button */}
              <div className="p-4 border-t border-white/5 bg-slate-900/98 space-y-3">
                <motion.button
                  onClick={handlePlay}
                  disabled={isSpeaking}
                  className="w-full h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-bold text-xl text-white touch-manipulation flex items-center justify-center gap-3 disabled:opacity-50"
                  whileTap={{ scale: 0.96 }}
                  animate={!isSpeaking ? {
                    boxShadow: ['0 0 20px rgba(6,182,212,0.3)', '0 0 40px rgba(6,182,212,0.6)', '0 0 20px rgba(6,182,212,0.3)'],
                  } : {}}
                  transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
                >
                  {isSpeaking ? (
                    <>🔊 Listening...</>
                  ) : (
                    <>🔊 Tell Me the Story!</>
                  )}
                </motion.button>

                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-white/5 text-white/50 rounded-xl font-medium text-sm touch-manipulation"
                >
                  🗺️ Back to Map
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
