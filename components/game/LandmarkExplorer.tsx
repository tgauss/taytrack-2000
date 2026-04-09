'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';
import { useGameStore } from '@/lib/game-state';
import { speakText as speak, stopElevenLabsSpeech, isElevenLabsAvailable, playPOIAudio } from '@/lib/voice';
import type { POI } from '@/lib/poi-data';

interface LandmarkExplorerProps {
  poi: POI | null;
  onClose: () => void;
}

// Each lesson is a step-by-step experience
type LessonStep = 'photo' | 'funfact' | 'didyouknow' | 'history';

const STEP_ORDER: LessonStep[] = ['photo', 'funfact', 'didyouknow', 'history'];

function getStepsForPoi(poi: POI): LessonStep[] {
  const steps: LessonStep[] = [];
  if (poi.imageUrl) steps.push('photo');
  steps.push('funfact');
  if (poi.didYouKnow) steps.push('didyouknow');
  steps.push('history');
  return steps;
}

export function LandmarkExplorer({ poi, onClose }: LandmarkExplorerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isMuted } = useGameStore();
  const hasAI = isElevenLabsAvailable();

  const steps = poi ? getStepsForPoi(poi) : [];
  const currentStep = steps[stepIndex] || 'funfact';
  const isLastStep = stepIndex >= steps.length - 1;

  // Reset on new POI
  useEffect(() => {
    setStepIndex(0);
    stopElevenLabsSpeech();
    setIsSpeaking(false);
  }, [poi?.id]);

  // Auto-play narration for each step — uses pre-generated audio for fun facts
  useEffect(() => {
    if (!poi || isMuted) return;

    const t = setTimeout(() => {
      // Try pre-generated audio first (for fun fact step)
      if (currentStep === 'funfact') {
        const played = playPOIAudio(poi.id, () => setIsSpeaking(true), () => setIsSpeaking(false));
        if (played) return;
      }

      // Fall back to browser TTS for other steps
      let text = '';
      if (currentStep === 'photo') text = `Look at this! This is ${poi.name}!`;
      else if (currentStep === 'funfact') text = poi.funFact;
      else if (currentStep === 'didyouknow') text = `Did you know? ${poi.didYouKnow}`;
      else if (currentStep === 'history') text = poi.historyLesson;

      if (text) {
        const voice = currentStep === 'history' ? 'storyteller' : 'excited';
        speak(text, voice, () => setIsSpeaking(true), () => setIsSpeaking(false));
      }
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi?.id, currentStep, isMuted]);

  const handleNext = () => {
    soundManager.tap();
    stopElevenLabsSpeech();
    if (isLastStep) {
      onClose();
    } else {
      setStepIndex(s => s + 1);
    }
  };

  const handleBack = () => {
    soundManager.tap();
    stopElevenLabsSpeech();
    if (stepIndex > 0) setStepIndex(s => s - 1);
  };

  const handleClose = () => { stopElevenLabsSpeech(); soundManager.tap(); onClose(); };

  const handleReplay = useCallback(() => {
    if (!poi || isMuted) return;
    // Try pre-generated audio first
    if (currentStep === 'funfact') {
      const played = playPOIAudio(poi.id, () => setIsSpeaking(true), () => setIsSpeaking(false));
      if (played) return;
    }
    // Fall back to browser TTS
    let text = '';
    if (currentStep === 'funfact') text = poi.funFact;
    else if (currentStep === 'didyouknow') text = `Did you know? ${poi.didYouKnow}`;
    else if (currentStep === 'history') text = poi.historyLesson;
    else if (currentStep === 'photo') text = `This is ${poi.name}!`;
    if (text) speak(text, currentStep === 'history' ? 'storyteller' : 'excited', () => setIsSpeaking(true), () => setIsSpeaking(false));
  }, [poi, currentStep, isMuted]);

  if (!poi) return null;

  const stepLabels: Record<LessonStep, string> = {
    photo: '📸 Look!',
    funfact: '⭐ Fun Fact',
    didyouknow: '💡 Did You Know?',
    history: '📜 History',
  };

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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="absolute bottom-0 left-0 right-0 max-h-[88vh] flex flex-col"
          >
            <div className="bg-slate-900 rounded-t-[28px] flex flex-col overflow-hidden border-t border-white/10 shadow-2xl">

              {/* Step indicator dots */}
              <div className="flex justify-center gap-2 pt-4 pb-2">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { stopElevenLabsSpeech(); setStepIndex(i); }}
                    className={`h-2 rounded-full transition-all touch-manipulation ${
                      i === stepIndex ? 'w-8 bg-cyan-400' : i < stepIndex ? 'w-2 bg-cyan-400/50' : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Step label */}
              <div className="text-center pb-2">
                <span className="text-sm font-bold text-white/50">
                  {stepLabels[currentStep]} ({stepIndex + 1}/{steps.length})
                </span>
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ maxHeight: '55vh' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${poi.id}-${currentStep}`}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* PHOTO STEP */}
                    {currentStep === 'photo' && poi.imageUrl && (
                      <div className="text-center">
                        <div className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg mb-4">
                          <img
                            src={poi.imageUrl}
                            alt={poi.name}
                            className="w-full max-h-[40vh] object-contain bg-black"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <motion.span
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-5xl"
                          >
                            {poi.emoji}
                          </motion.span>
                          <h2 className="text-2xl font-bold text-white">{poi.name}</h2>
                        </div>
                      </div>
                    )}

                    {/* FUN FACT STEP */}
                    {currentStep === 'funfact' && (
                      <div className="text-center py-4">
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-6xl block mb-5"
                        >
                          {poi.emoji}
                        </motion.span>
                        <h2 className="text-xl font-bold text-white mb-4">{poi.name}</h2>
                        <p className="text-xl leading-relaxed text-white/90 font-medium max-w-md mx-auto">
                          {poi.funFact}
                        </p>
                        {isSpeaking && (
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} className="mt-4 text-cyan-400 text-sm">
                            🔊 Listening...
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* DID YOU KNOW STEP */}
                    {currentStep === 'didyouknow' && (
                      <div className="py-4">
                        <div className="bg-amber-500/10 border-2 border-amber-500/25 rounded-2xl p-6 text-center">
                          <span className="text-5xl block mb-4">💡</span>
                          <h3 className="text-lg font-bold text-amber-400 uppercase tracking-wide mb-4">Did You Know?</h3>
                          <p className="text-xl leading-relaxed text-white/90 font-medium max-w-md mx-auto">
                            {poi.didYouKnow}
                          </p>
                          {isSpeaking && (
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} className="mt-4 text-amber-400 text-sm">
                              🔊 Listening...
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* HISTORY LESSON STEP */}
                    {currentStep === 'history' && (
                      <div className="py-4">
                        <div className="bg-indigo-500/10 border-2 border-indigo-500/25 rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">📜</span>
                            <h3 className="text-lg font-bold text-indigo-400">History Lesson</h3>
                          </div>
                          <p className="text-lg leading-relaxed text-white/85">
                            {poi.historyLesson}
                          </p>
                          {isSpeaking && (
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} className="mt-4 text-indigo-400 text-sm">
                              🔊 Reading the story...
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom action bar — BIG buttons for kids */}
              <div className="p-4 border-t border-white/5 bg-slate-900/98">
                <div className="flex gap-3">
                  {/* Replay sound */}
                  <button
                    onClick={handleReplay}
                    disabled={isSpeaking}
                    className="w-16 h-16 bg-white/10 hover:bg-white/15 rounded-2xl flex items-center justify-center text-2xl touch-manipulation transition-colors disabled:opacity-40 flex-shrink-0"
                  >
                    🔊
                  </button>

                  {/* Back button */}
                  {stepIndex > 0 && (
                    <button
                      onClick={handleBack}
                      className="w-16 h-16 bg-white/10 hover:bg-white/15 rounded-2xl flex items-center justify-center text-2xl touch-manipulation transition-colors flex-shrink-0"
                    >
                      ◀️
                    </button>
                  )}

                  {/* NEXT / DONE button — the big one */}
                  <motion.button
                    onClick={handleNext}
                    className={`flex-1 h-16 rounded-2xl font-bold text-xl touch-manipulation transition-colors flex items-center justify-center gap-2 ${
                      isLastStep
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    }`}
                    whileTap={{ scale: 0.96 }}
                    animate={!isSpeaking ? {
                      boxShadow: isLastStep
                        ? ['0 0 20px rgba(16,185,129,0.3)', '0 0 40px rgba(16,185,129,0.6)', '0 0 20px rgba(16,185,129,0.3)']
                        : ['0 0 20px rgba(6,182,212,0.3)', '0 0 40px rgba(6,182,212,0.6)', '0 0 20px rgba(6,182,212,0.3)'],
                    } : {}}
                    transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
                  >
                    {isLastStep ? (
                      <>🗺️ Back to Map</>
                    ) : (
                      <>Next ▶️</>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
