'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { CityModal } from '@/components/game/CityModal';
import { AchievementPopup } from '@/components/game/AchievementPopup';
import { BadgeCollection } from '@/components/game/BadgeCollection';
import { DailyJournal } from '@/components/game/DailyJournal';
import { LandmarkExplorer } from '@/components/game/LandmarkExplorer';
import { CityExplorer } from '@/components/game/CityExplorer';
import { ArrivalCelebration } from '@/components/game/ArrivalCelebration';
import { SendHug } from '@/components/game/SendHug';
import { PreTripCountdown } from '@/components/game/PreTripCountdown';
import { KiddoConnect, useNewMessages } from '@/components/game/KiddoConnect';
import { GoodNight } from '@/components/game/GoodNight';
import { PackingGame } from '@/components/games/PackingGame';
import { MemoryGame } from '@/components/games/MemoryGame';
import { useGameStore, getNextLocation, type GameLocation } from '@/lib/game-state';
import { soundManager } from '@/lib/sounds';
import { speakText, stopElevenLabsSpeech, playArrivalAudio, playLocalAudio, unlockAudio, preloadIntro, preloadNextSegment } from '@/lib/voice';
import type { POI } from '@/lib/poi-data';

const AdventureMap = dynamic(
  () => import('@/components/game/AdventureMap').then((mod) => mod.AdventureMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-spin mb-4">🌍</div>
          <p className="text-muted-foreground font-mono text-sm">Loading adventure map...</p>
        </div>
      </div>
    ),
  }
);

type ActiveGame = 'packing' | 'memory' | null;
type MenuPanel = 'none' | 'menu' | 'badges' | 'journal' | 'games' | 'connect' | 'goodnight';

// Arrival narrations are now pre-generated audio files in /public/audio/

const CITY_EMOJIS: Record<string, string> = {
  seattle: '☕', tulsa: '🤠', lincoln: '🌽', roca: '📦', omaha: '✈️', 'vancouver-return': '🏠',
};
const CITY_NAMES: Record<string, string> = {
  seattle: 'Seattle', tulsa: 'Tulsa', lincoln: 'Lincoln', roca: 'Roca', omaha: 'Omaha', 'vancouver-return': 'Home',
};

export default function GamePage() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [menuPanel, setMenuPanel] = useState<MenuPanel>('none');
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [voPlaying, setVOPlaying] = useState(false);
  // Portrait mode works fine — no landscape requirement
  const [celebrationCity, setCelebrationCity] = useState<{ name: string; emoji: string } | null>(null);
  const mapControlsRef = useRef<{ flyBackToCity: () => void; flyToPOI?: (poi: POI) => void; flyToCity?: (cityId: string) => void } | null>(null);
  const { resetGame, earnedBadges, currentLocation, isMuted, moveToLocation, setAnimating } = useGameStore();
  // Clear any stuck animation state on mount
  useEffect(() => { setAnimating(false); }, [setAnimating]);
  const exploreCityId = currentLocation === 'vancouver-return' ? 'vancouver' : currentLocation;
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('demo')) {
      const demoVal = params.get('demo') || '';
      const lastDemo = sessionStorage.getItem('taytrack-demo-key');
      setIsDemo(true);
      // If demo value changed, full reset — fresh adventure
      if (demoVal !== lastDemo) {
        sessionStorage.setItem('taytrack-demo-key', demoVal);
        // Clear game state (reset to vancouver)
        resetGame();
        // Clear caches
        if ('caches' in window) {
          caches.keys().then(names => names.forEach(name => caches.delete(name)));
        }
        navigator.serviceWorker?.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const dadMessageCount = useNewMessages();
  // Show intro only when starting fresh at vancouver (not when resuming mid-trip)
  useEffect(() => {
    if (currentLocation === 'vancouver') {
      setShowIntro(true);
    }
    // Preload intro and first segment VOs on mount
    preloadIntro();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  const handlePOITap = useCallback((poi: POI) => {
    // Fly to the POI first, then open the lesson after the camera arrives
    mapControlsRef.current?.flyToPOI?.(poi);
    setTimeout(() => setSelectedPOI(poi), 1800);
  }, []);

  const handleClosePOI = useCallback(() => {
    setSelectedPOI(null);
    mapControlsRef.current?.flyBackToCity();
  }, []);

  // Celebration + narration when arriving at a city, and preload next segment
  useEffect(() => {
    if (currentLocation === 'vancouver' || isMuted) return;
    const cityKey = currentLocation === 'vancouver-return' ? 'home' : currentLocation;

    // Preload VOs for next leg while arrival plays
    const nextLoc = getNextLocation(currentLocation);
    if (nextLoc) {
      preloadNextSegment(currentLocation, nextLoc);
    }

    // Trigger celebration
    setCelebrationCity({ name: CITY_NAMES[currentLocation] || '', emoji: CITY_EMOJIS[currentLocation] || '🎉' });
    setTimeout(() => setCelebrationCity(null), 3500);

    // Play arrival narration
    setVOPlaying(true);
    const timer = setTimeout(() => {
      playArrivalAudio(cityKey, undefined, () => {
        setVOPlaying(false);
        // Auto-launch packing game at Roca after "Can you help him?" narration
        if (currentLocation === 'roca') {
          setTimeout(() => setActiveGame('packing'), 1500);
        }
      });
    }, 3500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, isMuted]);

  // Handle caterpillar city tap — fly to that city
  const handleCaterpillarTap = useCallback((cityId: GameLocation) => {
    mapControlsRef.current?.flyToCity?.(cityId);
  }, []);


  const handleCityTap = (cityId: string) => setSelectedCity(cityId);
  const handlePlayGame = (gameId: string) => { setSelectedCity(null); setActiveGame(gameId as ActiveGame); };

  const handleReset = () => {
    soundManager.tap();
    stopElevenLabsSpeech();
    resetGame();
    // Reload to reinitialize the map at vancouver
    window.location.reload();
  };

  const dismissIntro = () => {
    // This tap unlocks audio on iOS Safari — must happen before any auto-play
    unlockAudio();
    setShowIntro(false);
    soundManager.fanfare();
    if (!isMuted) {
      setVOPlaying(true);
      playLocalAudio('intro', undefined, () => setVOPlaying(false));
    }
  };


  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Map */}
      <AdventureMap
        onCityTap={handleCityTap}
        onPOITap={handlePOITap}
        onMapReady={(controls) => { mapControlsRef.current = controls; }}
        hideGoButton={voPlaying || showIntro || !!activeGame || !!selectedPOI || menuPanel !== 'none'}
      />

      {/* ===== INTRO SCREEN ===== */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center px-8 max-w-lg"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                ✈️
              </motion.div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Dad&apos;s Big Adventure!
              </h1>
              <p className="text-xl text-white/80 mb-3 leading-relaxed">
                Dad is going on an 8-day trip far away! He&apos;ll fly on airplanes, drive through Kansas, and pack hundreds of boxes!
              </p>
              <p className="text-lg text-white/60 mb-8">
                Can you follow along and learn cool things about every place he goes?
              </p>

              <motion.button
                onClick={dismissIntro}
                className="px-12 py-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-2xl rounded-full shadow-2xl touch-manipulation"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: ['0 0 30px rgba(251,191,36,0.4)', '0 0 60px rgba(251,191,36,0.8)', '0 0 30px rgba(251,191,36,0.4)'] }}
                transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
              >
                LET&apos;S GO! 🚀
              </motion.button>

              <div className="mt-8 flex justify-center gap-3">
                {['✈️', '🚗', '📦', '🤠', '🌽', '🏠'].map((e, i) => (
                  <motion.span
                    key={i}
                    className="text-3xl"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  >
                    {e}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SIMPLIFIED TOP BAR ===== */}
      <div className="absolute top-5 left-5 right-5 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Home button only */}
        <Link href="/" className="pointer-events-auto">
          <motion.div
            className="w-16 h-16 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border touch-manipulation text-3xl"
            whileTap={{ scale: 0.9 }}
          >
            🏠
          </motion.div>
        </Link>

        {/* Center: Title (smaller) */}
        <div className="bg-card/70 backdrop-blur-sm rounded-full px-5 py-2 shadow-md border border-border">
          <span className="text-base font-bold text-foreground">Kiddos</span>
        </div>

        {/* Right: Simple emoji menu button */}
        <motion.button
          onClick={() => {
            soundManager.tap();
            setMenuPanel(menuPanel === 'menu' ? 'none' : 'menu');
          }}
          className="pointer-events-auto relative w-16 h-16 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border touch-manipulation text-3xl"
          whileTap={{ scale: 0.9 }}
        >
          ⭐
          {dadMessageCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              💌
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* ===== SIMPLE MENU (replaces 4 toolbar buttons) ===== */}
      <AnimatePresence>
        {menuPanel === 'menu' && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute top-16 right-3 z-40 pointer-events-auto"
          >
            <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border p-3 space-y-2 w-48">
              <button
                onClick={() => { soundManager.tap(); setMenuPanel('none'); setMenuPanel('badges'); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 touch-manipulation text-left"
              >
                <span className="text-2xl">🏆</span>
                <span className="font-bold text-sm text-foreground">My Stickers</span>
                {earnedBadges.length > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{earnedBadges.length}</span>
                )}
              </button>
              <button
                onClick={() => { soundManager.tap(); setMenuPanel('none'); setMenuPanel('journal'); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 touch-manipulation text-left"
              >
                <span className="text-2xl">📖</span>
                <span className="font-bold text-sm text-foreground">Dad&apos;s Story</span>
              </button>
              <button
                onClick={() => { soundManager.tap(); setMenuPanel('none'); setMenuPanel('connect'); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 touch-manipulation text-left"
              >
                <span className="text-2xl">💌</span>
                <span className="font-bold text-sm text-foreground">Talk to Dad</span>
              </button>
              <button
                onClick={() => { soundManager.tap(); setMenuPanel('none'); setMenuPanel('games'); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 touch-manipulation text-left"
              >
                <span className="text-2xl">🎮</span>
                <span className="font-bold text-sm text-foreground">Play Games</span>
              </button>
              <button
                onClick={() => { soundManager.tap(); useGameStore.getState().toggleMute(); setMenuPanel('none'); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 touch-manipulation text-left"
              >
                <span className="text-2xl">{isMuted ? '🔇' : '🔊'}</span>
                <span className="font-bold text-sm text-foreground">{isMuted ? 'Sound On' : 'Sound Off'}</span>
              </button>
              <button
                onClick={() => { soundManager.tap(); setMenuPanel('none'); setMenuPanel('goodnight'); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 touch-manipulation text-left"
              >
                <span className="text-2xl">🌙</span>
                <span className="font-bold text-sm text-foreground">Good Night Dad</span>
              </button>
              <button
                onClick={() => { setMenuPanel('none'); handleReset(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 touch-manipulation text-left"
              >
                <span className="text-2xl">🔄</span>
                <span className="font-bold text-sm text-foreground">Start Over</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* City Modal */}
      <CityModal cityId={selectedCity} onClose={() => setSelectedCity(null)} onPlayGame={handlePlayGame} />

      {/* Badge Collection */}
      <BadgeCollection isOpen={menuPanel === 'badges'} onClose={() => setMenuPanel('none')} />

      {/* Daily Journal */}
      <DailyJournal isOpen={menuPanel === 'journal'} onClose={() => setMenuPanel('none')} />

      {/* Games Menu */}
      <AnimatePresence>
        {menuPanel === 'games' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuPanel('none')}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card rounded-3xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold text-foreground text-center mb-6">🎮 Games!</h2>

              <div className="space-y-4">
                <motion.button
                  onClick={() => { soundManager.tap(); setMenuPanel('none'); setActiveGame('packing'); }}
                  className="w-full p-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center gap-4 text-white touch-manipulation"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-5xl">📦</span>
                  <div className="text-left">
                    <div className="font-bold text-xl">Pack Boxes!</div>
                    <div className="text-sm opacity-80">Tap the falling boxes!</div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => { soundManager.tap(); setMenuPanel('none'); setActiveGame('memory'); }}
                  className="w-full p-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center gap-4 text-white touch-manipulation"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-5xl">🎴</span>
                  <div className="text-left">
                    <div className="font-bold text-xl">Match Pairs!</div>
                    <div className="text-sm opacity-80">Find the matching cards!</div>
                  </div>
                </motion.button>
              </div>

              <button
                onClick={() => setMenuPanel('none')}
                className="w-full mt-4 py-4 bg-muted text-foreground rounded-xl font-bold text-lg touch-manipulation"
              >
                ← Back
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Game */}
      <AnimatePresence>
        {activeGame === 'packing' && <PackingGame onClose={() => setActiveGame(null)} />}
        {activeGame === 'memory' && <MemoryGame onClose={() => setActiveGame(null)} />}
      </AnimatePresence>

      {/* City Explorer bar */}
      {!activeGame && !showIntro && (
        <CityExplorer cityId={exploreCityId} onSelectPOI={handlePOITap} activePOIId={selectedPOI?.id || null} />
      )}

      {/* Landmark Explorer */}
      <LandmarkExplorer
        poi={selectedPOI}
        onClose={handleClosePOI}
        onNextPOI={(next) => {
          setSelectedPOI(null);
          handlePOITap(next);
        }}
      />

      {/* Kiddo Connect — messaging */}
      <KiddoConnect isOpen={menuPanel === 'connect'} onClose={() => setMenuPanel('none')} />

      {/* Good Night Dad */}
      <GoodNight isOpen={menuPanel === 'goodnight'} onClose={() => setMenuPanel('none')} />

      {/* Send Dad a Hug */}
      {!activeGame && !showIntro && <SendHug />}

      {/* Arrival Celebration */}
      <ArrivalCelebration cityName={celebrationCity?.name || null} cityEmoji={celebrationCity?.emoji} />

      {/* Pre-trip Countdown (shows before Apr 12) */}
      <PreTripCountdown />

      {/* Achievement Popup */}
      <AchievementPopup />
    </div>
  );
}
