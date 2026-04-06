'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/game-state';
import { getAchievementById } from '@/lib/achievements';
import { soundManager } from '@/lib/sounds';

export function AchievementPopup() {
  const { showingAchievement, showAchievement, isMuted } = useGameStore();
  
  const achievement = showingAchievement ? getAchievementById(showingAchievement) : null;
  
  // Play fanfare when achievement shows
  useEffect(() => {
    if (achievement && !isMuted) {
      soundManager.fanfare();
    }
  }, [achievement, isMuted]);
  
  // Auto-dismiss after delay
  useEffect(() => {
    if (showingAchievement) {
      const timer = setTimeout(() => {
        showAchievement(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showingAchievement, showAchievement]);
  
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
        >
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  backgroundColor: [
                    '#ff6b9d', '#ffd93d', '#4ade80', '#60a5fa', '#a855f7'
                  ][i % 5],
                  left: `${Math.random() * 100}%`,
                }}
                initial={{ 
                  top: '50%', 
                  scale: 0,
                  rotate: 0 
                }}
                animate={{ 
                  top: ['50%', `${Math.random() * 100}%`],
                  scale: [0, 1, 0],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  x: [0, (Math.random() - 0.5) * 200],
                }}
                transition={{ 
                  duration: 2,
                  delay: Math.random() * 0.3,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
          
          {/* Badge popup */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="bg-card rounded-3xl p-8 shadow-2xl border-4 border-primary text-center max-w-sm pointer-events-auto"
            onClick={() => showAchievement(null)}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{ backgroundColor: achievement.color }}
              animate={{ opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            
            {/* Badge icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="relative z-10 text-7xl mb-4"
            >
              {achievement.emoji}
            </motion.div>
            
            {/* Badge name */}
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 text-2xl font-bold text-foreground mb-2"
            >
              {achievement.name}
            </motion.h3>
            
            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative z-10 text-lg text-muted-foreground"
            >
              {achievement.description}
            </motion.p>
            
            {/* Tap to dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              className="relative z-10 text-sm text-muted-foreground mt-4"
            >
              Tap to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
