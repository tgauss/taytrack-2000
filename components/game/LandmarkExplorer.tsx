'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';
import type { POI } from '@/lib/poi-data';

interface LandmarkExplorerProps {
  poi: POI | null;
  onClose: () => void;
}

export function LandmarkExplorer({ poi, onClose }: LandmarkExplorerProps) {
  const [showFullLesson, setShowFullLesson] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { isMuted } = useGameStore();

  // Reset state when POI changes
  useEffect(() => {
    setShowFullLesson(false);
    setShowVideo(false);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [poi?.id]);

  // Auto-read the fun fact on open
  useEffect(() => {
    if (poi && !isMuted) {
      const timer = setTimeout(() => speakText(poi.funFact), 600);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi?.id, isMuted]);

  const speakText = useCallback((text: string) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const handleClose = () => {
    window.speechSynthesis.cancel();
    soundManager.tap();
    onClose();
  };

  if (!poi) return null;

  return (
    <AnimatePresence>
      {poi && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-4 top-20 bottom-24 w-[380px] max-w-[calc(100vw-2rem)] z-40 flex flex-col"
        >
          <div className="bg-card/95 backdrop-blur-md rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div
              className="relative px-5 py-5 flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${poi.color}dd, ${poi.color}88)` }}
            >
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <motion.span
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl"
                >
                  {poi.emoji}
                </motion.span>
                <div>
                  <h3 className="text-xl font-bold text-white drop-shadow-md leading-tight">
                    {poi.name}
                  </h3>
                  <p className="text-white/70 text-xs mt-0.5">
                    Tap to learn more!
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Fun fact card */}
              <div className="bg-muted rounded-2xl p-4">
                {isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="flex items-center gap-2 text-primary mb-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Reading...</span>
                  </motion.div>
                )}
                <p className="text-base leading-relaxed text-foreground font-medium">
                  {poi.funFact}
                </p>
                <button
                  onClick={() => speakText(poi.funFact)}
                  disabled={isSpeaking}
                  className="mt-3 px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-bold flex items-center gap-2 disabled:opacity-50 touch-manipulation"
                >
                  <Volume2 className="w-4 h-4" />
                  Read to Me
                </button>
              </div>

              {/* Did You Know? */}
              {poi.didYouKnow && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-500 mb-1">DID YOU KNOW?</p>
                      <p className="text-sm text-foreground leading-relaxed">{poi.didYouKnow}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => speakText(`Did you know? ${poi.didYouKnow}`)}
                    disabled={isSpeaking}
                    className="mt-2 ml-8 px-3 py-1.5 bg-amber-500/20 text-amber-500 rounded-full text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 touch-manipulation"
                  >
                    <Volume2 className="w-3 h-3" />
                    Listen
                  </button>
                </motion.div>
              )}

              {/* History lesson (expandable) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => {
                    soundManager.tap();
                    setShowFullLesson(!showFullLesson);
                    if (!showFullLesson && !isMuted) {
                      setTimeout(() => speakText(poi.historyLesson), 300);
                    }
                  }}
                  className="w-full p-4 flex items-center justify-between text-left touch-manipulation"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📜</span>
                    <span className="font-bold text-sm text-indigo-400">History Lesson</span>
                  </div>
                  {showFullLesson ? (
                    <ChevronUp className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-indigo-400" />
                  )}
                </button>

                <AnimatePresence>
                  {showFullLesson && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <p className="text-sm text-foreground leading-relaxed">
                          {poi.historyLesson}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(poi.historyLesson);
                          }}
                          disabled={isSpeaking}
                          className="mt-3 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold flex items-center gap-2 disabled:opacity-50 touch-manipulation"
                        >
                          <Volume2 className="w-4 h-4" />
                          Read History to Me
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* YouTube video */}
              {poi.youtubeId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {!showVideo ? (
                    <button
                      onClick={() => {
                        soundManager.tap();
                        setShowVideo(true);
                      }}
                      className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 touch-manipulation hover:bg-red-500/20 transition-colors"
                    >
                      <span className="text-3xl">▶️</span>
                      <div className="text-left">
                        <div className="font-bold text-sm text-red-400">Watch a Video!</div>
                        <div className="text-xs text-muted-foreground">Learn more about {poi.name}</div>
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-2xl overflow-hidden border border-red-500/30">
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${poi.youtubeId}?rel=0&modestbranding=1`}
                          title={`Video about ${poi.name}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <button
                        onClick={() => setShowVideo(false)}
                        className="w-full py-2 text-xs text-muted-foreground font-bold touch-manipulation"
                      >
                        Close Video
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer action */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <button
                onClick={handleClose}
                className="w-full py-3 bg-muted text-foreground rounded-xl font-bold text-sm touch-manipulation flex items-center justify-center gap-2"
              >
                <span>🗺️</span> Back to Map
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
