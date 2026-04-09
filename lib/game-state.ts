'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GameLocation = 'vancouver' | 'seattle' | 'tulsa' | 'lincoln' | 'roca' | 'omaha' | 'vancouver-return';

export interface GameState {
  // Current position in the journey
  currentLocation: GameLocation;
  visitedLocations: GameLocation[];

  // Achievements
  earnedBadges: string[];

  // Sound
  isMuted: boolean;

  // Mini-game scores
  packingHighScore: number;
  memoryBestTime: number;

  // History explorer
  unlockedHistoryStamps: string[]; // city IDs where history was viewed
  visitedPOIs: string[]; // POI IDs the kids have explored

  // Animation state
  isAnimating: boolean;
  showingAchievement: string | null;

  // Actions
  moveToLocation: (location: GameLocation) => void;
  earnBadge: (badgeId: string) => void;
  toggleMute: () => void;
  setPackingScore: (score: number) => void;
  setMemoryTime: (time: number) => void;
  setAnimating: (isAnimating: boolean) => void;
  showAchievement: (badgeId: string | null) => void;
  unlockHistoryStamp: (cityId: string) => void;
  markPOIVisited: (poiId: string) => void;
  resetGame: () => void;
}

const initialState = {
  currentLocation: 'vancouver' as GameLocation,
  visitedLocations: ['vancouver'] as GameLocation[],
  earnedBadges: [] as string[],
  isMuted: false,
  packingHighScore: 0,
  memoryBestTime: 0,
  unlockedHistoryStamps: [] as string[],
  visitedPOIs: [] as string[],
  isAnimating: false,
  showingAchievement: null as string | null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      moveToLocation: (location) => {
        const { visitedLocations } = get();
        if (!visitedLocations.includes(location)) {
          set({
            currentLocation: location,
            visitedLocations: [...visitedLocations, location],
          });
        } else {
          set({ currentLocation: location });
        }
      },

      earnBadge: (badgeId) => {
        const { earnedBadges } = get();
        if (!earnedBadges.includes(badgeId)) {
          set({ earnedBadges: [...earnedBadges, badgeId] });
        }
      },

      toggleMute: () => {
        set((state) => ({ isMuted: !state.isMuted }));
      },

      setPackingScore: (score) => {
        const { packingHighScore } = get();
        if (score > packingHighScore) {
          set({ packingHighScore: score });
        }
      },

      setMemoryTime: (time) => {
        const { memoryBestTime } = get();
        if (memoryBestTime === 0 || time < memoryBestTime) {
          set({ memoryBestTime: time });
        }
      },

      setAnimating: (isAnimating) => set({ isAnimating }),

      showAchievement: (badgeId) => set({ showingAchievement: badgeId }),

      markPOIVisited: (poiId) => {
        const { visitedPOIs } = get();
        if (!visitedPOIs.includes(poiId)) {
          set({ visitedPOIs: [...visitedPOIs, poiId] });
        }
      },

      unlockHistoryStamp: (cityId) => {
        const { unlockedHistoryStamps } = get();
        if (!unlockedHistoryStamps.includes(cityId)) {
          set({ unlockedHistoryStamps: [...unlockedHistoryStamps, cityId] });
        }
      },

      resetGame: () => set(initialState),
    }),
    {
      name: 'taytrack-game-storage',
      // Migrate old 'portland' state to 'vancouver'
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>;
        if (state.currentLocation === 'portland') {
          state.currentLocation = 'vancouver';
        }
        if (state.currentLocation === 'portland-return') {
          state.currentLocation = 'vancouver-return';
        }
        if (Array.isArray(state.visitedLocations)) {
          state.visitedLocations = (state.visitedLocations as string[]).map((loc: string) => {
            if (loc === 'portland') return 'vancouver';
            if (loc === 'portland-return') return 'vancouver-return';
            return loc;
          });
        }
        return state;
      },
      version: 1,
    }
  )
);

// Route segments for animation - matches the actual trip itinerary
export const routeSegments: { from: GameLocation; to: GameLocation; type: 'flight' | 'drive' }[] = [
  { from: 'vancouver', to: 'seattle', type: 'flight' },     // PDX -> SEA (layover)
  { from: 'seattle', to: 'tulsa', type: 'flight' },          // SEA -> TUL
  { from: 'tulsa', to: 'lincoln', type: 'drive' },           // Drive to Nebraska
  { from: 'lincoln', to: 'roca', type: 'drive' },            // To warehouse
  { from: 'roca', to: 'omaha', type: 'drive' },              // To departure city
  { from: 'omaha', to: 'vancouver-return', type: 'flight' }, // OMA -> SEA -> PDX (home!)
];

export const getNextLocation = (current: GameLocation): GameLocation | null => {
  const segment = routeSegments.find(s => s.from === current);
  return segment ? segment.to : null;
};

export const getSegmentType = (from: GameLocation, to: GameLocation): 'flight' | 'drive' | null => {
  const segment = routeSegments.find(s => s.from === from && s.to === to);
  return segment ? segment.type : null;
};

export const isJourneyComplete = (visitedLocations: GameLocation[]): boolean => {
  return visitedLocations.includes('vancouver-return');
};
