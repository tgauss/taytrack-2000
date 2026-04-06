'use client';

import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '@/lib/game-state';
import { soundManager } from '@/lib/sounds';

export function SoundToggle() {
  const { isMuted, toggleMute } = useGameStore();
  
  const handleToggle = () => {
    // Play a sound before muting (so user hears feedback)
    if (!isMuted) {
      soundManager.tap();
    }
    toggleMute();
    // Play sound after unmuting
    if (isMuted) {
      setTimeout(() => soundManager.tap(), 100);
    }
  };
  
  return (
    <motion.button
      onClick={handleToggle}
      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
        isMuted 
          ? 'bg-muted text-muted-foreground' 
          : 'bg-primary text-primary-foreground'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {isMuted ? (
        <VolumeX className="w-6 h-6" />
      ) : (
        <Volume2 className="w-6 h-6" />
      )}
    </motion.button>
  );
}
