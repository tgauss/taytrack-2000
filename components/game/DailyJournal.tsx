'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { journalEntries, getAvailableEntries, type JournalEntry } from '@/lib/daily-journal';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';

interface DailyJournalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyJournal({ isOpen, onClose }: DailyJournalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isMuted } = useGameStore();

  // For demo/preview, show all entries. During the trip, show only available ones.
  const tripStart = new Date('2026-04-12T00:00:00');
  const now = new Date();
  const entries = now >= tripStart ? getAvailableEntries() : journalEntries;

  // Reset to latest entry when opening
  useEffect(() => {
    if (isOpen && entries.length > 0) {
      setCurrentIndex(entries.length - 1);
    }
  }, [isOpen, entries.length]);

  const currentEntry = entries[currentIndex];

  const speakStory = useCallback(() => {
    if (!currentEntry || isMuted) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentEntry.story);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [currentEntry, isMuted]);

  const handleClose = () => {
    window.speechSynthesis.cancel();
    soundManager.tap();
    onClose();
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      soundManager.tap();
      window.speechSynthesis.cancel();
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < entries.length - 1) {
      soundManager.tap();
      window.speechSynthesis.cancel();
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (!currentEntry) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-card rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 py-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-center">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors touch-manipulation"
              >
                <X className="w-6 h-6" />
              </button>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl mb-2"
              >
                {currentEntry.emoji}
              </motion.div>
              <h2 className="text-2xl font-bold text-white">
                Day {currentEntry.day}: {currentEntry.title}
              </h2>
              <p className="text-white/70 text-sm mt-1">
                {new Date(currentEntry.date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Story content */}
            <div className="p-6">
              {/* Speaking indicator */}
              {isSpeaking && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="flex items-center gap-2 text-primary mb-3"
                >
                  <Volume2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Reading the story...</span>
                </motion.div>
              )}

              <div className="bg-muted rounded-2xl p-6 mb-4">
                <p className="text-lg leading-relaxed text-foreground">
                  {currentEntry.story}
                </p>
              </div>

              {/* Fun detail */}
              {currentEntry.funDetail && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🤯</span>
                    <p className="text-base text-foreground leading-relaxed">
                      <span className="font-bold text-amber-500">Fun Fact: </span>
                      {currentEntry.funDetail}
                    </p>
                  </div>
                </div>
              )}

              {/* Sleeps counter */}
              {currentEntry.sleepsLeft > 0 && (
                <div className="text-center mb-4">
                  <span className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm font-bold">
                    <span className="text-lg">😴</span>
                    {currentEntry.sleepsLeft} sleep{currentEntry.sleepsLeft !== 1 ? 's' : ''} until Dad&apos;s home!
                  </span>
                </div>
              )}

              {currentEntry.sleepsLeft === 0 && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-center mb-4"
                >
                  <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-lg font-bold">
                    🏠 Dad is HOME!
                  </span>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="w-14 h-14 bg-muted rounded-full flex items-center justify-center disabled:opacity-30 touch-manipulation"
                >
                  <ChevronLeft className="w-8 h-8 text-foreground" />
                </button>

                <button
                  onClick={speakStory}
                  disabled={isSpeaking}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold flex items-center gap-2 disabled:opacity-50 touch-manipulation"
                >
                  <Volume2 className="w-5 h-5" />
                  Read to Me
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIndex >= entries.length - 1}
                  className="w-14 h-14 bg-muted rounded-full flex items-center justify-center disabled:opacity-30 touch-manipulation"
                >
                  <ChevronRight className="w-8 h-8 text-foreground" />
                </button>
              </div>

              {/* Day indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {entries.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      soundManager.tap();
                      window.speechSynthesis.cancel();
                      setCurrentIndex(i);
                    }}
                    className={`w-3 h-3 rounded-full transition-all touch-manipulation ${
                      i === currentIndex
                        ? 'bg-primary scale-125'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
