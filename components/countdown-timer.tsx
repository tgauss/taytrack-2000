'use client';

import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ 
  targetDate, 
  label,
  completedLabel 
}: { 
  targetDate: string; 
  label: string;
  completedLabel: string;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsComplete(true);
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isComplete) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">{completedLabel}</p>
        <div className="text-4xl animate-bounce">🎉</div>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="animate-pulse">
        <div className="h-16 bg-muted rounded-lg" />
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: 'DAYS', emoji: '📅' },
    { value: timeLeft.hours, label: 'HRS', emoji: '⏰' },
    { value: timeLeft.minutes, label: 'MIN', emoji: '⚡' },
    { value: timeLeft.seconds, label: 'SEC', emoji: '💨' },
  ];

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 text-center font-mono uppercase tracking-wider">
        {label}
      </p>
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {timeUnits.map(({ value, label, emoji }) => (
          <div
            key={label}
            className="relative bg-card border border-border rounded-xl p-3 md:p-4 text-center overflow-hidden group"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              <div className="text-2xl md:text-4xl font-mono font-bold text-foreground tabular-nums">
                {String(value).padStart(2, '0')}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground font-mono mt-1">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
