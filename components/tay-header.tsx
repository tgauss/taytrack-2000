'use client';

import { useState, useEffect } from 'react';

const funSubtitles = [
  "Dad's Epic Adventure Tracker",
  "Where in the World is Dad?",
  "Mission Control for the Fam",
  "Dad Locator 9000",
  "The Ultimate Dad GPS",
];

export function TayHeader() {
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => {
        setSubtitleIndex((prev) => (prev + 1) % funSubtitles.length);
        setIsGlitching(false);
      }, 150);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative text-center py-8 md:py-12">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-4xl md:text-5xl animate-bounce" style={{ animationDelay: '0ms' }}>🛰️</span>
          <span className="text-4xl md:text-5xl animate-bounce" style={{ animationDelay: '100ms' }}>✈️</span>
          <span className="text-4xl md:text-5xl animate-bounce" style={{ animationDelay: '200ms' }}>🚗</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
            TayTrack
          </span>
          <span className="inline-block ml-2 px-3 py-1 bg-primary text-primary-foreground text-2xl md:text-4xl lg:text-5xl rounded-lg font-mono transform -rotate-2">
            2000
          </span>
        </h1>

        {/* Animated subtitle */}
        <p
          className={`text-lg md:text-xl text-muted-foreground font-mono transition-all duration-150 ${
            isGlitching ? 'opacity-0 blur-sm' : 'opacity-100 blur-0'
          }`}
        >
          {funSubtitles[subtitleIndex]}
        </p>

        {/* Status indicator */}
        <div className="mt-6 inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border px-4 py-2 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <span className="text-sm font-mono text-foreground">SYSTEM ONLINE</span>
        </div>
      </div>
    </header>
  );
}
