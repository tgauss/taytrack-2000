'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { journalEntries } from '@/lib/daily-journal';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';
import { playLocalAudio, stopElevenLabsSpeech } from '@/lib/voice';

interface DailyJournalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyJournal({ isOpen, onClose }: DailyJournalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isMuted } = useGameStore();

  const today = new Date().toISOString().split('T')[0];
  const tripStart = '2026-04-12';

  // Determine which entries are unlocked
  const isUnlocked = (date: string) => {
    // Before trip starts, show all as preview
    if (today < tripStart) return true;
    // During/after trip, only show days that have happened
    return date <= today;
  };

  // Reset to latest unlocked entry when opening
  useEffect(() => {
    if (isOpen) {
      stopElevenLabsSpeech();
      setIsSpeaking(false);
      const lastUnlocked = journalEntries.filter(e => isUnlocked(e.date)).length - 1;
      setCurrentIndex(Math.max(0, lastUnlocked));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const currentEntry = journalEntries[currentIndex];
  const locked = currentEntry ? !isUnlocked(currentEntry.date) : false;

  const handlePlay = () => {
    if (!currentEntry || isMuted) return;
    soundManager.tap();
    stopElevenLabsSpeech();

    if (locked) {
      playLocalAudio('journal-locked', () => setIsSpeaking(true), () => setIsSpeaking(false));
    } else {
      playLocalAudio(currentEntry.audioKey, () => setIsSpeaking(true), () => setIsSpeaking(false));
    }
  };

  const handleClose = () => {
    stopElevenLabsSpeech();
    soundManager.tap();
    onClose();
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      soundManager.tap();
      stopElevenLabsSpeech();
      setIsSpeaking(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < journalEntries.length - 1) {
      soundManager.tap();
      stopElevenLabsSpeech();
      setIsSpeaking(false);
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
          className="fixed inset-0 z-[100]"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="absolute bottom-0 left-0 right-0 max-h-[88vh] flex flex-col"
          >
            <div className="bg-slate-900 rounded-t-[28px] flex flex-col overflow-hidden border-t border-white/10 shadow-2xl">

              {/* Day selector dots */}
              <div className="flex justify-center gap-2 pt-4 pb-2">
                {journalEntries.map((entry, i) => {
                  const unlocked = isUnlocked(entry.date);
                  return (
                    <button
                      key={i}
                      onClick={() => { soundManager.tap(); stopElevenLabsSpeech(); setIsSpeaking(false); setCurrentIndex(i); }}
                      className={`h-2.5 rounded-full transition-all touch-manipulation ${
                        i === currentIndex
                          ? 'w-8 bg-purple-400'
                          : unlocked
                            ? 'w-2.5 bg-purple-400/50'
                            : 'w-2.5 bg-white/10'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Header */}
              <div className="text-center px-6 pt-2 pb-4">
                <motion.div
                  key={currentEntry.day}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl mb-2"
                >
                  {locked ? '🔒' : currentEntry.emoji}
                </motion.div>
                <h2 className="text-2xl font-bold text-white">
                  {locked ? 'Coming Soon!' : `Day ${currentEntry.day}: ${currentEntry.title}`}
                </h2>
                <p className="text-sm text-white/40 mt-1">
                  {new Date(currentEntry.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ maxHeight: '45vh' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentEntry.day}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.2 }}
                  >
                    {locked ? (
                      <div className="text-center py-8">
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-6xl mb-4"
                        >
                          🔮
                        </motion.div>
                        <p className="text-lg text-white/60">
                          This story hasn&apos;t happened yet!
                        </p>
                        <p className="text-base text-white/40 mt-2">
                          Come back on {new Date(currentEntry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} to hear what Dad does!
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Story text */}
                        <div className="bg-white/5 rounded-2xl p-5 mb-4">
                          {isSpeaking && (
                            <motion.div
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="text-cyan-400 text-sm mb-3 flex items-center gap-2"
                            >
                              🔊 Listening...
                            </motion.div>
                          )}
                          <p className="text-base leading-relaxed text-white/85">
                            {currentEntry.voScript}
                          </p>
                        </div>

                        {/* Fun detail */}
                        <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <span className="text-xl">🤯</span>
                            <p className="text-sm text-white/70">
                              <span className="font-bold text-amber-400">Fun Fact: </span>
                              {currentEntry.funDetail}
                            </p>
                          </div>
                        </div>

                        {/* Sleeps counter */}
                        {currentEntry.sleepsLeft > 0 && (
                          <div className="text-center mb-2">
                            <span className="inline-flex items-center gap-2 bg-purple-500/15 text-purple-300 px-4 py-2 rounded-full text-sm font-bold">
                              😴 {currentEntry.sleepsLeft} sleep{currentEntry.sleepsLeft !== 1 ? 's' : ''} until Dad&apos;s home!
                            </span>
                          </div>
                        )}
                        {currentEntry.sleepsLeft === 0 && (
                          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-center mb-2">
                            <span className="inline-flex items-center gap-2 bg-green-500/15 text-green-300 px-4 py-2 rounded-full text-base font-bold">
                              🏠 Dad is HOME!
                            </span>
                          </motion.div>
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom bar */}
              <div className="p-4 border-t border-white/5 bg-slate-900/98">
                <div className="flex gap-3">
                  {/* Back */}
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-xl touch-manipulation disabled:opacity-20"
                  >
                    ◀️
                  </button>

                  {/* BIG read to me / listen button */}
                  <motion.button
                    onClick={handlePlay}
                    disabled={isSpeaking}
                    className="flex-1 h-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl font-bold text-lg text-white touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50"
                    whileTap={{ scale: 0.96 }}
                    animate={!isSpeaking ? {
                      boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 40px rgba(139,92,246,0.6)', '0 0 20px rgba(139,92,246,0.3)'],
                    } : {}}
                    transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
                  >
                    {isSpeaking ? '🔊 Listening...' : locked ? '🔒 Peek!' : '🔊 Read to Me!'}
                  </motion.button>

                  {/* Forward */}
                  <button
                    onClick={handleNext}
                    disabled={currentIndex >= journalEntries.length - 1}
                    className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-xl touch-manipulation disabled:opacity-20"
                  >
                    ▶️
                  </button>
                </div>

                {/* Close */}
                <button
                  onClick={handleClose}
                  className="w-full mt-3 py-3 bg-white/5 text-white/60 rounded-xl font-medium text-sm touch-manipulation"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
