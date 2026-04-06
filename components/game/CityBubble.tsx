'use client';

import { motion } from 'framer-motion';
import type { CityData } from '@/lib/fun-facts';

interface CityBubbleProps {
  city: CityData;
  isVisited: boolean;
  isCurrent: boolean;
  isHome: boolean;
  onTap: () => void;
}

export function CityBubble({ city, isVisited, isCurrent, isHome, onTap }: CityBubbleProps) {
  return (
    <motion.button
      onClick={onTap}
      className="absolute flex flex-col items-center gap-1 touch-manipulation"
      style={{
        left: `${city.coordinates.x}%`,
        top: `${city.coordinates.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={isCurrent ? {
        scale: [1, 1.1, 1],
      } : {}}
      transition={isCurrent ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
    >
      {/* Glow ring for current location */}
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: 80,
            height: 80,
            marginLeft: -40 + 30,
            marginTop: -40 + 30,
            background: `radial-gradient(circle, ${city.color}40 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.3, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      )}
      
      {/* Main bubble */}
      <motion.div
        className="relative flex items-center justify-center rounded-full shadow-lg"
        style={{
          width: 60,
          height: 60,
          backgroundColor: isVisited ? city.color : '#374151',
          border: `4px solid ${isVisited ? 'white' : '#6b7280'}`,
        }}
        animate={isCurrent ? {
          y: [0, -5, 0],
        } : {}}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <span className="text-2xl" role="img" aria-label={city.name}>
          {isHome ? '🏠' : city.emoji}
        </span>
        
        {/* Visited checkmark */}
        {isVisited && !isCurrent && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </motion.div>
      
      {/* City name label */}
      <motion.div
        className="px-2 py-1 rounded-lg text-white text-sm font-bold shadow-md"
        style={{
          backgroundColor: isVisited ? city.color : '#374151',
        }}
      >
        {city.name}
      </motion.div>
    </motion.button>
  );
}
