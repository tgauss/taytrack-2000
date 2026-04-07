'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Home, Gamepad2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { CityModal } from '@/components/game/CityModal';
import { AchievementPopup } from '@/components/game/AchievementPopup';
import { BadgeCollection } from '@/components/game/BadgeCollection';
import { SoundToggle } from '@/components/game/SoundToggle';
import { DailyJournal } from '@/components/game/DailyJournal';
import { LandmarkExplorer } from '@/components/game/LandmarkExplorer';
import { PackingGame } from '@/components/games/PackingGame';
import { MemoryGame } from '@/components/games/MemoryGame';
import { useGameStore } from '@/lib/game-state';
import { soundManager } from '@/lib/sounds';
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

export default function GamePage() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [showBadges, setShowBadges] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [isLandscape, setIsLandscape] = useState(true);
  const mapControlsRef = useRef<{ flyBackToCity: () => void } | null>(null);
  const { resetGame, earnedBadges } = useGameStore();

  const handlePOITap = useCallback((poi: POI) => {
    setSelectedPOI(poi);
  }, []);

  const handleClosePOI = useCallback(() => {
    setSelectedPOI(null);
    mapControlsRef.current?.flyBackToCity();
  }, []);

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleCityTap = (cityId: string) => {
    setSelectedCity(cityId);
  };

  const handlePlayGame = (gameId: string) => {
    setSelectedCity(null);
    setActiveGame(gameId as ActiveGame);
  };

  const handleReset = () => {
    soundManager.tap();
    if (confirm('Start a new adventure? This will reset your progress!')) {
      resetGame();
    }
  };

  // Portrait mode - gentle suggestion instead of blocking
  if (!isLandscape) {
    return (
      <div className="fixed inset-0 bg-background">
        {/* Still show the map underneath */}
        <AdventureMap
          onCityTap={handleCityTap}
          onPOITap={handlePOITap}
          onMapReady={(controls) => { mapControlsRef.current = controls; }}
        />

        {/* Overlay with suggestion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-8 text-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm bg-card rounded-3xl p-8"
          >
            <motion.div
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="text-6xl mb-6"
            >
              📱
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Turn Your Device!
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              The adventure map works best sideways!
            </p>
            <button
              onClick={() => setIsLandscape(true)}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg touch-manipulation"
            >
              Continue Anyway
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Main game area */}
      <AdventureMap
          onCityTap={handleCityTap}
          onPOITap={handlePOITap}
          onMapReady={(controls) => { mapControlsRef.current = controls; }}
        />

      {/* Top bar controls */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Left side - Home & Reset */}
        <div className="flex gap-2 pointer-events-auto">
          <Link href="/">
            <motion.div
              className="w-14 h-14 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border touch-manipulation"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Home className="w-6 h-6 text-foreground" />
            </motion.div>
          </Link>

          <motion.button
            onClick={handleReset}
            className="w-14 h-14 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border touch-manipulation"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <RotateCcw className="w-6 h-6 text-foreground" />
          </motion.button>
        </div>

        {/* Center - Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card/80 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg border border-border"
        >
          <h1 className="text-lg font-bold text-foreground">
            TayTrack 2000
          </h1>
        </motion.div>

        {/* Right side - Journal, Games, Badges, Sound */}
        <div className="flex gap-2 pointer-events-auto">
          <motion.button
            onClick={() => {
              soundManager.tap();
              setShowJournal(true);
            }}
            className="w-14 h-14 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border touch-manipulation"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Dad's Journal"
          >
            <BookOpen className="w-6 h-6 text-foreground" />
          </motion.button>

          <motion.button
            onClick={() => {
              soundManager.tap();
              setShowGames(true);
            }}
            className="w-14 h-14 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border touch-manipulation"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Gamepad2 className="w-6 h-6 text-foreground" />
          </motion.button>

          <motion.button
            onClick={() => {
              soundManager.tap();
              setShowBadges(true);
            }}
            className="relative w-14 h-14 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border touch-manipulation"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trophy className="w-6 h-6 text-foreground" />
            {earnedBadges.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {earnedBadges.length}
              </span>
            )}
          </motion.button>

          <SoundToggle />
        </div>
      </div>

      {/* City Modal */}
      <CityModal
        cityId={selectedCity}
        onClose={() => setSelectedCity(null)}
        onPlayGame={handlePlayGame}
      />

      {/* Badge Collection */}
      <BadgeCollection
        isOpen={showBadges}
        onClose={() => setShowBadges(false)}
      />

      {/* Daily Journal */}
      <DailyJournal
        isOpen={showJournal}
        onClose={() => setShowJournal(false)}
      />

      {/* Games Menu */}
      <AnimatePresence>
        {showGames && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              soundManager.tap();
              setShowGames(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card rounded-3xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-foreground text-center mb-6">
                Mini Games
              </h2>

              <div className="space-y-4">
                <motion.button
                  onClick={() => {
                    soundManager.tap();
                    setShowGames(false);
                    setActiveGame('packing');
                  }}
                  className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center gap-4 text-white touch-manipulation"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-4xl">📦</span>
                  <div className="text-left">
                    <div className="font-bold text-lg">Packing Game</div>
                    <div className="text-sm opacity-80">Tap boxes to pack them!</div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => {
                    soundManager.tap();
                    setShowGames(false);
                    setActiveGame('memory');
                  }}
                  className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center gap-4 text-white touch-manipulation"
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-4xl">🎴</span>
                  <div className="text-left">
                    <div className="font-bold text-lg">Memory Match</div>
                    <div className="text-sm opacity-80">Find matching pairs!</div>
                  </div>
                </motion.button>
              </div>

              <button
                onClick={() => {
                  soundManager.tap();
                  setShowGames(false);
                }}
                className="w-full mt-4 py-3 bg-muted text-foreground rounded-xl font-bold touch-manipulation"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Game */}
      <AnimatePresence>
        {activeGame === 'packing' && (
          <PackingGame onClose={() => setActiveGame(null)} />
        )}
        {activeGame === 'memory' && (
          <MemoryGame onClose={() => setActiveGame(null)} />
        )}
      </AnimatePresence>

      {/* Landmark Explorer */}
      <LandmarkExplorer poi={selectedPOI} onClose={handleClosePOI} />

      {/* Achievement Popup - always on top */}
      <AchievementPopup />
    </div>
  );
}
