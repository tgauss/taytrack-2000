'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { useGameStore } from '@/lib/game-state';
import { achievements } from '@/lib/achievements';
import { soundManager } from '@/lib/sounds';

interface BadgeCollectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeCollection({ isOpen, onClose }: BadgeCollectionProps) {
  const { earnedBadges } = useGameStore();

  const handleClose = () => {
    soundManager.tap();
    onClose();
  };

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
            className="relative w-full max-w-md bg-card rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 py-6 bg-gradient-to-r from-primary to-secondary text-center">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>

              <Trophy className="w-12 h-12 mx-auto mb-2 text-primary-foreground" />
              <h2 className="text-2xl font-bold text-primary-foreground">
                Sticker Book
              </h2>
              <p className="text-primary-foreground/80 text-sm mt-1">
                {earnedBadges.length} of {achievements.length} collected!
              </p>
            </div>

            {/* Badge grid */}
            <div className="p-6 grid grid-cols-3 gap-4">
              {achievements.map((badge, index) => {
                const isEarned = earnedBadges.includes(badge.id);

                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 ${
                      isEarned
                        ? 'bg-muted'
                        : 'bg-muted/30 border-2 border-dashed border-muted'
                    }`}
                  >
                    <motion.div
                      animate={isEarned ? {
                        scale: [1, 1.1, 1],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2
                      }}
                      className="text-3xl mb-1"
                      style={{ opacity: isEarned ? 1 : 0.2 }}
                    >
                      {badge.emoji}
                    </motion.div>
                    <span
                      className={`text-xs text-center font-medium leading-tight ${
                        isEarned ? 'text-foreground' : 'text-muted-foreground/50'
                      }`}
                    >
                      {isEarned ? badge.name : (badge.hint || '???')}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Encouragement message */}
            <div className="px-6 pb-6 text-center">
              {earnedBadges.length === achievements.length ? (
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-lg font-bold text-primary"
                >
                  Amazing! You collected them all!
                </motion.p>
              ) : (
                <p className="text-muted-foreground">
                  Keep following Dad&apos;s adventure to earn more!
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
