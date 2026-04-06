'use client';

import { useState } from 'react';

interface InfoSection {
  id: string;
  title: string;
  emoji: string;
  content: React.ReactNode;
}

const infoSections: InfoSection[] = [
  {
    id: 'flights',
    title: 'Flight Details',
    emoji: '✈️',
    content: (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <span>🛫</span> Outbound - Sunday, April 12
          </h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p><span className="text-foreground font-mono">PDX → SEA:</span> Alaska AS 2048, departs 7:18 AM</p>
            <p><span className="text-foreground font-mono">Layover:</span> 1h 47m in Seattle</p>
            <p><span className="text-foreground font-mono">SEA → TUL:</span> Alaska AS 2350</p>
            <p><span className="text-foreground font-mono">Arrives:</span> 4:03 PM in Tulsa</p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <span>🛬</span> Return - Sunday, April 19
          </h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p><span className="text-foreground font-mono">OMA → SEA:</span> Alaska AS 312, departs 2:17 PM</p>
            <p><span className="text-foreground font-mono">Layover:</span> 3h 29m in Seattle</p>
            <p><span className="text-foreground font-mono">SEA → PDX:</span> Alaska AS 2007</p>
            <p><span className="text-foreground font-mono">Arrives:</span> 8:25 PM at PDX</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'conference',
    title: 'Conference Info',
    emoji: '🎭',
    content: (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-bold text-foreground mb-2">Main Street Now Conference 2026</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Theme: &quot;Main Street at the Crossroads: Building Durable Futures&quot;
          </p>
          <div className="text-sm space-y-2 text-muted-foreground">
            <p><span className="font-mono text-foreground">📍 Location:</span> Arvest Convention Center & Tulsa Theater</p>
            <p><span className="font-mono text-foreground">📅 Dates:</span> April 13-15, 2026</p>
            <p><span className="font-mono text-foreground">👥 Attending with:</span> Business partner Joe DiPietro</p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-bold text-foreground mb-2">Key Sessions</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Opening Plenary @ Tulsa Theater</li>
            <li>• 100+ education sessions</li>
            <li>• Mobile workshops around Tulsa</li>
            <li>• Visiting 4 Main Street districts</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'raregoods',
    title: 'Rare Goods Event',
    emoji: '📦',
    content: (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-bold text-foreground mb-2">Nebraska Pickup Week</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Fulfilling ~379 customer orders from the Nebraska drop!
          </p>
          <div className="text-sm space-y-2 text-muted-foreground">
            <p><span className="font-mono text-foreground">📍 Location:</span> Roca, Nebraska Warehouse</p>
            <p><span className="font-mono text-foreground">📦 In-person pickups:</span> ~200 orders</p>
            <p><span className="font-mono text-foreground">📬 Shipped orders:</span> ~180 orders</p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-bold text-foreground mb-2">Schedule</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li><span className="font-mono text-primary">Wed 4/15:</span> Packing Day</li>
            <li><span className="font-mono text-primary">Thu 4/16:</span> Pickup Night (5-8 PM)</li>
            <li><span className="font-mono text-primary">Fri 4/17:</span> THE BIG DAY (10AM-8PM)</li>
            <li><span className="font-mono text-primary">Sat 4/18:</span> Final Pickup (10AM-7PM)</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Dad',
    emoji: '📱',
    content: (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-6xl mb-4">📞</p>
          <p className="text-muted-foreground text-sm mb-4">
            Dad will have his phone with him the whole trip! Call or text anytime.
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Best times to reach Dad:</p>
            <p className="font-mono text-foreground">Mornings & Evenings</p>
            <p className="text-xs text-muted-foreground mt-2">
              (He might be in sessions or helping customers during the day!)
            </p>
          </div>
        </div>
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
          <p className="text-sm text-accent-foreground">
            💝 Miss you already! See you April 19th!
          </p>
        </div>
      </div>
    ),
  },
];

export function QuickInfo() {
  const [activeSection, setActiveSection] = useState('flights');

  const currentSection = infoSections.find((s) => s.id === activeSection)!;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Tab navigation */}
      <div className="flex overflow-x-auto border-b border-border">
        {infoSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-mono transition-colors flex flex-col items-center gap-1 ${
              activeSection === section.id
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <span className="text-xl">{section.emoji}</span>
            <span className="hidden sm:inline text-xs">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span>{currentSection.emoji}</span>
          {currentSection.title}
        </h3>
        {currentSection.content}
      </div>
    </div>
  );
}
