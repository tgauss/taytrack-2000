'use client';

import { motion } from 'framer-motion';

interface DadVehicleProps {
  x: number;
  y: number;
  type: 'plane' | 'car';
  isMoving: boolean;
}

export function DadVehicle({ x, y, type, isMoving }: DadVehicleProps) {
  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      animate={{
        left: `${x}%`,
        top: `${y}%`,
      }}
      transition={{
        duration: 2,
        ease: "easeInOut"
      }}
    >
      {/* Vehicle container with offset for centering */}
      <motion.div
        className="relative -translate-x-1/2 -translate-y-1/2"
        animate={isMoving ? {
          rotate: type === 'plane' ? [0, -5, 5, 0] : [0, -2, 2, 0],
        } : {
          y: [0, -3, 0],
        }}
        transition={isMoving ? {
          duration: 0.5,
          repeat: Infinity,
        } : {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Dad icon with vehicle */}
        <div className="relative">
          {/* Vehicle */}
          <motion.div
            className="text-4xl"
            animate={isMoving && type === 'plane' ? {
              scale: [1, 1.1, 1],
            } : {}}
            transition={{
              duration: 0.3,
              repeat: Infinity,
            }}
          >
            {type === 'plane' ? '✈️' : '🚗'}
          </motion.div>
          
          {/* Dad's face in a circle - positioned on the vehicle */}
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center shadow-md"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <span className="text-lg">👨</span>
          </motion.div>
          
          {/* Motion trail when moving */}
          {isMoving && (
            <>
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div 
                  className="w-10 h-10 rounded-full"
                  style={{
                    background: type === 'plane' 
                      ? 'radial-gradient(circle, rgba(100,200,255,0.5) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(255,200,100,0.5) 0%, transparent 70%)'
                  }}
                />
              </motion.div>
              
              {/* Speed lines */}
              {type === 'plane' && (
                <motion.div
                  className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                >
                  <div className="w-4 h-0.5 bg-white rounded-full" />
                  <div className="w-6 h-0.5 bg-white rounded-full" />
                  <div className="w-4 h-0.5 bg-white rounded-full" />
                </motion.div>
              )}
              
              {type === 'car' && (
                <motion.div
                  className="absolute -left-4 bottom-0 flex gap-1"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 0.2, repeat: Infinity }}
                >
                  <div className="w-2 h-2 bg-gray-400 rounded-full opacity-50" />
                  <div className="w-3 h-3 bg-gray-400 rounded-full opacity-30" />
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
