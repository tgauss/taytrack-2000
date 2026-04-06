'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Volume2, BookOpen, Sparkles } from 'lucide-react';
import { getCityById } from '@/lib/fun-facts';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';

interface CityModalProps {
  cityId: string | null;
  onClose: () => void;
  onPlayGame?: (gameId: string) => void;
}

type Tab = 'facts' | 'history';

export function CityModal({ cityId, onClose, onPlayGame }: CityModalProps) {
  const [factIndex, setFactIndex] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('facts');
  const { isMuted, unlockHistoryStamp, earnBadge, showAchievement, unlockedHistoryStamps } = useGameStore();

  const city = cityId ? getCityById(cityId) : null;

  // Reset when city changes
  useEffect(() => {
    setFactIndex(0);
    setHistoryIndex(0);
    setActiveTab('facts');
  }, [cityId]);

  // Text-to-speech
  const speakText = useCallback((text: string) => {
    if (isMuted) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Auto-speak when fact changes
  useEffect(() => {
    if (!city || isMuted) return;

    let text: string;
    if (activeTab === 'facts') {
      text = city.facts[factIndex]?.forKids || '';
    } else {
      text = city.historyFacts[historyIndex]?.forKids || '';
    }

    if (text) {
      const timer = setTimeout(() => speakText(text), 500);
      return () => clearTimeout(timer);
    }
  }, [city, factIndex, historyIndex, activeTab, speakText, isMuted]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Unlock history stamp when viewing history
  useEffect(() => {
    if (activeTab === 'history' && cityId) {
      unlockHistoryStamp(cityId);
      if (!unlockedHistoryStamps.includes(cityId)) {
        // First time viewing history for this city - award badge after a moment
        setTimeout(() => {
          earnBadge('history-buff');
          showAchievement('history-buff');
        }, 1000);
      }
    }
  }, [activeTab, cityId, unlockHistoryStamp, earnBadge, showAchievement, unlockedHistoryStamps]);

  const handleNextFact = () => {
    if (!city) return;
    soundManager.tap();
    if (activeTab === 'facts') {
      setFactIndex((prev) => (prev + 1) % city.facts.length);
    } else {
      setHistoryIndex((prev) => (prev + 1) % city.historyFacts.length);
    }
  };

  const handlePrevFact = () => {
    if (!city) return;
    soundManager.tap();
    if (activeTab === 'facts') {
      setFactIndex((prev) => (prev - 1 + city.facts.length) % city.facts.length);
    } else {
      setHistoryIndex((prev) => (prev - 1 + city.historyFacts.length) % city.historyFacts.length);
    }
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    soundManager.tap();
    onClose();
  };

  if (!city) return null;

  const currentFact = activeTab === 'facts' ? city.facts[factIndex] : null;
  const currentHistory = activeTab === 'history' ? city.historyFacts[historyIndex] : null;
  const totalDots = activeTab === 'facts' ? city.facts.length : city.historyFacts.length;
  const currentDotIndex = activeTab === 'facts' ? factIndex : historyIndex;
  const hasGame = cityId === 'roca';
  const hasHistory = city.historyFacts.length > 0;

  return (
    <AnimatePresence>
      {cityId && (
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
            {/* Header with city color */}
            <div
              className="relative px-6 py-6 text-center"
              style={{ backgroundColor: city.color }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors touch-manipulation"
              >
                <X className="w-6 h-6" />
              </button>

              {/* City emoji and name */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-2"
              >
                {city.emoji}
              </motion.div>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                {city.name}
              </h2>
            </div>

            {/* Tab switcher */}
            {hasHistory && (
              <div className="flex gap-2 px-6 pt-4">
                <button
                  onClick={() => {
                    soundManager.tap();
                    setActiveTab('facts');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all touch-manipulation ${
                    activeTab === 'facts'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Fun Facts
                </button>
                <button
                  onClick={() => {
                    soundManager.tap();
                    setActiveTab('history');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all touch-manipulation ${
                    activeTab === 'history'
                      ? 'bg-amber-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  History
                </button>
              </div>
            )}

            {/* Content area */}
            <div className="p-6">
              {/* Fact card */}
              <motion.div
                key={`${activeTab}-${currentDotIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-muted rounded-2xl p-6 min-h-[160px] flex flex-col justify-center"
              >
                {/* Speaking indicator */}
                {isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="flex items-center gap-2 text-primary mb-3"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Speaking...</span>
                  </motion.div>
                )}

                {/* History year badge */}
                {activeTab === 'history' && currentHistory?.year && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{currentHistory.emoji}</span>
                    <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-bold">
                      {currentHistory.year}
                    </span>
                  </div>
                )}

                <p className="text-xl leading-relaxed text-foreground font-medium">
                  {activeTab === 'facts' ? currentFact?.forKids : currentHistory?.forKids}
                </p>
              </motion.div>

              {/* Navigation dots */}
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalDots }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      soundManager.tap();
                      if (activeTab === 'facts') setFactIndex(i);
                      else setHistoryIndex(i);
                    }}
                    className={`w-3 h-3 rounded-full transition-all touch-manipulation ${
                      i === currentDotIndex
                        ? activeTab === 'history' ? 'bg-amber-500 scale-125' : 'bg-primary scale-125'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation arrows */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={handlePrevFact}
                  className="w-14 h-14 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors touch-manipulation"
                >
                  <ChevronLeft className="w-8 h-8 text-foreground" />
                </button>

                {/* Speak again button */}
                <button
                  onClick={() => {
                    const text = activeTab === 'facts'
                      ? currentFact?.forKids
                      : currentHistory?.forKids;
                    if (text) speakText(text);
                  }}
                  disabled={isSpeaking}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 touch-manipulation"
                >
                  <Volume2 className="w-5 h-5" />
                  Listen
                </button>

                <button
                  onClick={handleNextFact}
                  className="w-14 h-14 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors touch-manipulation"
                >
                  <ChevronRight className="w-8 h-8 text-foreground" />
                </button>
              </div>

              {/* Play game button for Roca */}
              {hasGame && onPlayGame && (
                <motion.button
                  onClick={() => {
                    soundManager.success();
                    onPlayGame('packing');
                  }}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 touch-manipulation"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl">📦</span>
                  Play Packing Game!
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
