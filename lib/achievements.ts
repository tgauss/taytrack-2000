export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  hint?: string; // Shown when locked so kids know what to do
  unlockedAt?: string; // City ID where this unlocks
}

export const achievements: Achievement[] = [
  {
    id: 'wheels-up',
    name: 'Up, Up, and Away!',
    description: 'Dad took off on his first flight!',
    emoji: '✈️',
    color: '#60a5fa',
    hint: 'Start the journey!',
    unlockedAt: 'seattle'
  },
  {
    id: 'coffee-break',
    name: 'Coffee Break!',
    description: 'Visited Seattle - home of coffee!',
    emoji: '☕',
    color: '#92400e',
    hint: 'Visit Seattle',
    unlockedAt: 'seattle'
  },
  {
    id: 'howdy-partner',
    name: 'Howdy Partner!',
    description: 'Dad arrived in Oklahoma!',
    emoji: '🤠',
    color: '#f97316',
    hint: 'Reach Tulsa',
    unlockedAt: 'tulsa'
  },
  {
    id: 'history-buff',
    name: 'History Explorer!',
    description: 'Learned cool history about a city!',
    emoji: '📜',
    color: '#d97706',
    hint: 'Read history facts',
  },
  {
    id: 'conference-champ',
    name: 'Conference Champion!',
    description: 'Dad finished his big meeting!',
    emoji: '⭐',
    color: '#eab308',
    hint: 'Finish the conference',
    unlockedAt: 'lincoln'
  },
  {
    id: 'road-tripper',
    name: 'Road Trip!',
    description: 'Dad drove all the way to Nebraska!',
    emoji: '🚗',
    color: '#22c55e',
    hint: 'Drive to Nebraska',
    unlockedAt: 'lincoln'
  },
  {
    id: 'cornhusker',
    name: 'Cornhusker Kid!',
    description: 'Made it to the land of corn!',
    emoji: '🌽',
    color: '#eab308',
    hint: 'Arrive in Lincoln',
    unlockedAt: 'lincoln'
  },
  {
    id: 'packing-pro',
    name: 'Packing Pro!',
    description: 'Helped pack all the boxes!',
    emoji: '📦',
    color: '#a855f7',
    hint: 'Visit the warehouse',
    unlockedAt: 'roca'
  },
  {
    id: 'box-champion',
    name: 'Box Champion!',
    description: 'Packed 15 boxes in the packing game!',
    emoji: '🏆',
    color: '#f59e0b',
    hint: 'Pack 15+ boxes',
  },
  {
    id: 'memory-master',
    name: 'Memory Master!',
    description: 'Matched all the pairs!',
    emoji: '🧠',
    color: '#06b6d4',
    hint: 'Win Memory Match',
  },
  {
    id: 'omaha-explorer',
    name: 'Gateway Explorer!',
    description: 'Reached Omaha - Gateway to the West!',
    emoji: '🌅',
    color: '#ec4899',
    hint: 'Reach Omaha',
    unlockedAt: 'omaha',
  },
  {
    id: 'home-sweet-home',
    name: 'Home Sweet Home!',
    description: 'Dad came back home!',
    emoji: '🏠',
    color: '#ec4899',
    hint: 'Complete the journey',
    unlockedAt: 'vancouver-return'
  },
  {
    id: 'super-tracker',
    name: 'Super Tracker!',
    description: 'Followed the whole adventure!',
    emoji: '🌈',
    color: '#8b5cf6',
    hint: 'Earn all other badges',
  }
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return achievements.find(a => a.id === id);
};

export const getAchievementsForCity = (cityId: string): Achievement[] => {
  return achievements.filter(a => a.unlockedAt === cityId);
};
