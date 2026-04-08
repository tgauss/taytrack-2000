'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';
import { speakText as speak, stopElevenLabsSpeech, isElevenLabsAvailable } from '@/lib/voice';
import type { POI } from '@/lib/poi-data';

interface LandmarkExplorerProps {
  poi: POI | null;
  onClose: () => void;
}

export function LandmarkExplorer({ poi, onClose }: LandmarkExplorerProps) {
  const [showLesson, setShowLesson] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isMuted } = useGameStore();
  const hasAI = isElevenLabsAvailable();

  useEffect(() => {
    setShowLesson(false);
    stopElevenLabsSpeech();
    setIsSpeaking(false);
  }, [poi?.id]);

  // Auto-read fun fact
  useEffect(() => {
    if (poi && !isMuted) {
      const t = setTimeout(() => speak(poi.funFact, 'excited', () => setIsSpeaking(true), () => setIsSpeaking(false)), 600);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi?.id, isMuted]);

  const handleSpeak = useCallback((text: string, voice: 'narrator' | 'excited' | 'storyteller' = 'narrator') => {
    if (isMuted) return;
    speak(text, voice, () => setIsSpeaking(true), () => setIsSpeaking(false));
  }, [isMuted]);

  const handleClose = () => { stopElevenLabsSpeech(); soundManager.tap(); onClose(); };

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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          {/* Card — full-width bottom sheet on iPad */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-white/30" />
            </div>

            <div className="bg-slate-900/98 backdrop-blur-xl rounded-t-[28px] flex flex-col overflow-hidden border-t border-white/10">
              {/* Hero section with image */}
              <div className="relative">
                {poi.imageUrl && (
                  <div className="w-full h-48 overflow-hidden">
                    <img src={poi.imageUrl} alt={poi.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-11 h-11 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xl touch-manipulation"
                >
                  ✕
                </button>

                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end gap-3">
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-5xl drop-shadow-lg"
                    >
                      {poi.emoji}
                    </motion.span>
                    <div>
                      <h2 className="text-2xl font-bold text-white drop-shadow-lg leading-tight">
                        {poi.name}
                      </h2>
                      {isSpeaking && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-xs text-cyan-400 mt-1"
                        >
                          🔊 Listening...
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content — scrollable */}
              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 max-h-[50vh]">

                {/* Fun Fact — big and readable */}
                <div className="bg-white/5 rounded-2xl p-5">
                  <p className="text-lg leading-relaxed text-white/90 font-medium">
                    {poi.funFact}
                  </p>
                  <button
                    onClick={() => handleSpeak(poi.funFact, 'excited')}
                    disabled={isSpeaking}
                    className="mt-4 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-full text-base font-bold flex items-center gap-2 disabled:opacity-40 touch-manipulation transition-colors"
                  >
                    🔊 {hasAI ? 'Tell Me!' : 'Read to Me'}
                  </button>
                </div>

                {/* Did You Know — prominent */}
                {poi.didYouKnow && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-amber-500/10 border-2 border-amber-500/25 rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">💡</span>
                      <span className="text-sm font-bold text-amber-400 uppercase tracking-wide">Did You Know?</span>
                    </div>
                    <p className="text-base text-white/80 leading-relaxed">{poi.didYouKnow}</p>
                    <button
                      onClick={() => handleSpeak(`Did you know? ${poi.didYouKnow}`, 'narrator')}
                      disabled={isSpeaking}
                      className="mt-3 px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-40 touch-manipulation transition-colors"
                    >
                      🔊 Listen
                    </button>
                  </motion.div>
                )}

                {/* History Lesson — expandable */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={() => {
                      soundManager.tap();
                      const opening = !showLesson;
                      setShowLesson(opening);
                      if (opening && !isMuted) setTimeout(() => handleSpeak(poi.historyLesson, 'storyteller'), 300);
                    }}
                    className="w-full p-5 bg-indigo-500/10 border-2 border-indigo-500/25 rounded-2xl flex items-center justify-between touch-manipulation hover:bg-indigo-500/15 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📜</span>
                      <span className="font-bold text-base text-indigo-400">History Lesson</span>
                    </div>
                    <motion.span
                      animate={{ rotate: showLesson ? 180 : 0 }}
                      className="text-indigo-400 text-xl"
                    >
                      ▼
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {showLesson && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-indigo-500/5 border-x-2 border-b-2 border-indigo-500/25 rounded-b-2xl p-5 -mt-3">
                          <p className="text-base text-white/80 leading-relaxed">
                            {poi.historyLesson}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSpeak(poi.historyLesson, 'storyteller'); }}
                            disabled={isSpeaking}
                            className="mt-4 px-5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-40 touch-manipulation transition-colors"
                          >
                            🔊 {hasAI ? 'Tell Me the Story!' : 'Read History'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* YouTube video */}
                {poi.youtubeId && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-red-500/10 border-2 border-red-500/25 rounded-2xl overflow-hidden"
                  >
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${poi.youtubeId}?rel=0&modestbranding=1`}
                        title={`Video about ${poi.name}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Bottom action bar */}
              <div className="p-4 border-t border-white/5 bg-slate-900/95">
                <button
                  onClick={handleClose}
                  className="w-full py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-bold text-base touch-manipulation flex items-center justify-center gap-2 transition-colors"
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
