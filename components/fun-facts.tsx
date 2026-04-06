'use client';

import { useState } from 'react';

const funFacts = [
  {
    emoji: '🤠',
    title: 'Tulsa Fun Fact',
    fact: 'Tulsa is known as the "Oil Capital of the World" and has 4 nationally designated Main Street districts!',
  },
  {
    emoji: '🌽',
    title: 'Nebraska Fun Fact',
    fact: 'Nebraska produces more popcorn than any other state - about 250 million pounds per year!',
  },
  {
    emoji: '✈️',
    title: 'Flight Fun Fact',
    fact: "Dad will fly over 3,200 miles total on this trip - that's like flying from New York to London!",
  },
  {
    emoji: '📦',
    title: 'Rare Goods Fun Fact',
    fact: 'The team will help 379 customers get their rare goods - about half will pick up in person!',
  },
  {
    emoji: '🏛️',
    title: 'Conference Fun Fact',
    fact: 'The Main Street Now Conference brings together community leaders from across the country to help make downtowns awesome!',
  },
  {
    emoji: '🚗',
    title: 'Road Trip Fun Fact',
    fact: "Dad will drive about 350 miles from Tulsa to Lincoln - that's like driving from our house to the beach 7 times!",
  },
];

export function FunFacts() {
  const [currentFact, setCurrentFact] = useState(0);

  const nextFact = () => {
    setCurrentFact((prev) => (prev + 1) % funFacts.length);
  };

  const prevFact = () => {
    setCurrentFact((prev) => (prev - 1 + funFacts.length) % funFacts.length);
  };

  const fact = funFacts[currentFact];

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>🧠</span> Fun Facts for Kids!
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          {currentFact + 1} / {funFacts.length}
        </span>
      </div>

      <div className="text-center py-6">
        <span className="text-6xl md:text-8xl block mb-4">{fact.emoji}</span>
        <h3 className="text-xl font-bold text-primary mb-2">{fact.title}</h3>
        <p className="text-muted-foreground leading-relaxed">{fact.fact}</p>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={prevFact}
          className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors font-mono text-sm"
        >
          ← Back
        </button>
        <button
          onClick={nextFact}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors font-mono text-sm"
        >
          Next →
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {funFacts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentFact(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentFact
                ? 'bg-primary w-4'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
