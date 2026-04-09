'use client';

/**
 * Voice narration system
 *
 * Uses pre-generated audio files (ElevenLabs "Eric" voice) saved locally.
 * Falls back to browser TTS if no local audio exists.
 * Zero runtime API calls — all audio is baked in.
 */

// Pre-generated audio file map
const LOCAL_AUDIO: Record<string, string> = {
  // Intro
  'intro': '/audio/intro.mp3',

  // Drive to airport
  'drive-home-to-airport': '/audio/drive-home-to-airport.mp3',

  // In-flight / driving narrations
  'flight-vancouver-seattle': '/audio/flight-vancouver-seattle.mp3',
  'flight-seattle-tulsa': '/audio/flight-seattle-tulsa.mp3',
  'drive-tulsa-lincoln': '/audio/drive-tulsa-lincoln.mp3',
  'drive-lincoln-roca': '/audio/drive-lincoln-roca.mp3',
  'drive-roca-omaha': '/audio/drive-roca-omaha.mp3',
  'flight-omaha-home': '/audio/flight-omaha-home.mp3', // Legacy single VO
  'flight-omaha-seattle': '/audio/flight-omaha-seattle.mp3',
  'layover-seattle': '/audio/layover-seattle.mp3',
  'flight-seattle-pdx': '/audio/flight-seattle-pdx.mp3',

  // Good Night Dad
  'goodnight-1': '/audio/goodnight-1.mp3',
  'goodnight-2': '/audio/goodnight-2.mp3',
  'goodnight-3': '/audio/goodnight-3.mp3',

  // Send Dad a Hug
  'hug-1': '/audio/hug-1.mp3',
  'hug-2': '/audio/hug-2.mp3',
  'hug-3': '/audio/hug-3.mp3',

  // Pre-trip countdown
  'countdown-4': '/audio/countdown-4.mp3',
  'countdown-3': '/audio/countdown-3.mp3',
  'countdown-2': '/audio/countdown-2.mp3',
  'countdown-1': '/audio/countdown-1.mp3',
  'countdown-today': '/audio/countdown-today.mp3',

  // Dad's Story journal
  'journal-locked': '/audio/journal-locked.mp3',
  'journal-day1': '/audio/journal-day1.mp3',
  'journal-day2': '/audio/journal-day2.mp3',
  'journal-day3': '/audio/journal-day3.mp3',
  'journal-day4': '/audio/journal-day4.mp3',
  'journal-day5': '/audio/journal-day5.mp3',
  'journal-day6': '/audio/journal-day6.mp3',
  'journal-day7': '/audio/journal-day7.mp3',
  'journal-day8': '/audio/journal-day8.mp3',

  // Full landmark narrations
  'tulsa-golden-driller-full': '/audio/tulsa-golden-driller-full.mp3',
  'tulsa-center-universe-full': '/audio/tulsa-center-universe-full.mp3',
  'tulsa-penguins-full': '/audio/tulsa-penguins-full.mp3',
  'tulsa-cave-house-full': '/audio/tulsa-cave-house-full.mp3',
  'tulsa-tunnels-full': '/audio/tulsa-tunnels-full.mp3',
  'tulsa-elephant-law-full': '/audio/tulsa-elephant-law-full.mp3',
  'tulsa-time-capsule-full': '/audio/tulsa-time-capsule-full.mp3',
  'tulsa-yield-sign-full': '/audio/tulsa-yield-sign-full.mp3',
  'tulsa-route66-full': '/audio/tulsa-route66-full.mp3',
  'tulsa-gathering-place-full': '/audio/tulsa-gathering-place-full.mp3',
  'tulsa-blue-whale-full': '/audio/tulsa-blue-whale-full.mp3',
  'lincoln-capitol-full': '/audio/lincoln-capitol-full.mp3',
  'lincoln-stadium-full': '/audio/lincoln-stadium-full.mp3',
  'lincoln-morrill-full': '/audio/lincoln-morrill-full.mp3',
  'lincoln-haymarket-full': '/audio/lincoln-haymarket-full.mp3',
  'lincoln-sunken-gardens-full': '/audio/lincoln-sunken-gardens-full.mp3',
  'roca-berry-farm-full': '/audio/roca-berry-farm-full.mp3',
  'roca-warehouse-full': '/audio/roca-warehouse-full.mp3',
  'omaha-zoo-full': '/audio/omaha-zoo-full.mp3',
  'omaha-bridge-full': '/audio/omaha-bridge-full.mp3',
  'omaha-durham-full': '/audio/omaha-durham-full.mp3',
  'omaha-old-market-full': '/audio/omaha-old-market-full.mp3',
  'omaha-bigboy-full': '/audio/omaha-bigboy-full.mp3',

  // City arrivals
  'arrive-seattle': '/audio/arrive-seattle.mp3',
  'arrive-tulsa': '/audio/arrive-tulsa.mp3',
  'arrive-lincoln': '/audio/arrive-lincoln.mp3',
  'arrive-roca': '/audio/arrive-roca.mp3',
  'arrive-omaha': '/audio/arrive-omaha.mp3',
  'arrive-home': '/audio/arrive-home.mp3',

  // Tulsa landmark fun facts
  'tulsa-golden-driller-fact': '/audio/tulsa-golden-driller-fact.mp3',
  'tulsa-center-universe-fact': '/audio/tulsa-center-universe-fact.mp3',
  'tulsa-penguins-fact': '/audio/tulsa-penguins-fact.mp3',
  'tulsa-cave-house-fact': '/audio/tulsa-cave-house-fact.mp3',
  'tulsa-tunnels-fact': '/audio/tulsa-tunnels-fact.mp3',
  'tulsa-elephant-law-fact': '/audio/tulsa-elephant-law-fact.mp3',
  'tulsa-time-capsule-fact': '/audio/tulsa-time-capsule-fact.mp3',
  'tulsa-yield-sign-fact': '/audio/tulsa-yield-sign-fact.mp3',
  'tulsa-route66-fact': '/audio/tulsa-route66-fact.mp3',
  'tulsa-gathering-place-fact': '/audio/tulsa-gathering-place-fact.mp3',
  'tulsa-blue-whale-fact': '/audio/tulsa-blue-whale-fact.mp3',

  // Lincoln landmark fun facts
  'lincoln-capitol-fact': '/audio/lincoln-capitol-fact.mp3',
  'lincoln-stadium-fact': '/audio/lincoln-stadium-fact.mp3',
  'lincoln-morrill-fact': '/audio/lincoln-morrill-fact.mp3',
  'lincoln-haymarket-fact': '/audio/lincoln-haymarket-fact.mp3',
  'lincoln-sunken-gardens-fact': '/audio/lincoln-sunken-gardens-fact.mp3',

  // Roca landmark fun facts
  'roca-berry-farm-fact': '/audio/roca-berry-farm-fact.mp3',
  'roca-warehouse-fact': '/audio/roca-warehouse-fact.mp3',

  // Omaha landmark fun facts
  'omaha-zoo-fact': '/audio/omaha-zoo-fact.mp3',
  'omaha-bridge-fact': '/audio/omaha-bridge-fact.mp3',
  'omaha-durham-fact': '/audio/omaha-durham-fact.mp3',
  'omaha-old-market-fact': '/audio/omaha-old-market-fact.mp3',
  'omaha-bigboy-fact': '/audio/omaha-bigboy-fact.mp3',
};

// Full landmark narrations (combined fun fact + DYK + history)
const POI_FULL_AUDIO: Record<string, string> = {
  'tulsa-golden-driller': 'tulsa-golden-driller-full',
  'tulsa-center-universe': 'tulsa-center-universe-full',
  'tulsa-penguins': 'tulsa-penguins-full',
  'tulsa-cave-house': 'tulsa-cave-house-full',
  'tulsa-tunnels': 'tulsa-tunnels-full',
  'tulsa-elephant-law': 'tulsa-elephant-law-full',
  'tulsa-time-capsule': 'tulsa-time-capsule-full',
  'tulsa-yield-sign': 'tulsa-yield-sign-full',
  'tulsa-route66': 'tulsa-route66-full',
  'tulsa-gathering-place': 'tulsa-gathering-place-full',
  'tulsa-blue-whale': 'tulsa-blue-whale-full',
  'lincoln-capitol': 'lincoln-capitol-full',
  'lincoln-stadium': 'lincoln-stadium-full',
  'lincoln-morrill': 'lincoln-morrill-full',
  'lincoln-haymarket': 'lincoln-haymarket-full',
  'lincoln-sunken-gardens': 'lincoln-sunken-gardens-full',
  'roca-berry-farm': 'roca-berry-farm-full',
  'roca-warehouse': 'roca-warehouse-full',
  'omaha-zoo': 'omaha-zoo-full',
  'omaha-bridge': 'omaha-bridge-full',
  'omaha-durham': 'omaha-durham-full',
  'omaha-old-market': 'omaha-old-market-full',
  'omaha-bigboy': 'omaha-bigboy-full',
};

// Audio preload cache — keyed by audio key, stores ready-to-play Audio elements
const preloadCache = new Map<string, HTMLAudioElement>();

// Currently playing audio
let currentAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

/**
 * Call this on the first user gesture (tap) to unlock audio on iOS Safari.
 * Creates and plays a silent audio element, which satisfies Safari's autoplay policy.
 */
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    // Play a tiny silent audio to unlock the audio context
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    audio.volume = 0.01;
    audio.play().then(() => {
      audioUnlocked = true;
      audio.pause();
    }).catch(() => {});

    // Also unlock AudioContext for sound effects
    const ctx = new AudioContext();
    ctx.resume().then(() => ctx.close()).catch(() => {});
  } catch {}
}

export type VoiceType = 'narrator' | 'excited' | 'storyteller';

export function isElevenLabsAvailable(): boolean {
  return true; // We always have pre-generated audio
}

/**
 * Preload an audio file into the cache so it plays instantly later.
 */
export function preloadAudio(key: string): void {
  if (preloadCache.has(key)) return;
  const path = LOCAL_AUDIO[key];
  if (!path) return;
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = path;
  // Start loading — the browser will fetch and buffer the file
  audio.load();
  preloadCache.set(key, audio);
}

/**
 * Preload all VOs for a trip segment (travel VO + arrival VO + city POI VOs).
 * Call this when arriving at a city to warm the cache for the next leg.
 */
export function preloadNextSegment(fromCity: string, toCity: string): void {
  // Travel VO
  const travelKey = TRAVEL_AUDIO[`${fromCity}-${toCity}`];
  if (travelKey) preloadAudio(travelKey);

  // Arrival VO
  const arrivalCity = toCity === 'vancouver-return' ? 'home' : toCity;
  preloadAudio(`arrive-${arrivalCity}`);

  // Return flight VOs
  if (fromCity === 'omaha') {
    preloadAudio('flight-omaha-seattle');
    preloadAudio('layover-seattle');
    preloadAudio('flight-seattle-pdx');
  }

  // City POI VOs for destination
  Object.keys(POI_FULL_AUDIO).forEach(poiId => {
    if (poiId.startsWith(toCity + '-') || (toCity === 'vancouver-return' && poiId.startsWith('vancouver-'))) {
      preloadAudio(POI_FULL_AUDIO[poiId]);
    }
  });
}

/**
 * Preload the intro and first segment VOs (call on app mount).
 */
export function preloadIntro(): void {
  preloadAudio('intro');
  preloadAudio('drive-home-to-airport');
  preloadAudio('flight-vancouver-seattle');
  preloadAudio('arrive-seattle');
}

/**
 * Play a pre-generated audio file by key.
 * Uses preload cache for instant playback if available.
 * Returns true if a local file was found and played.
 */
export function playLocalAudio(
  key: string,
  onStart?: () => void,
  onEnd?: () => void,
): boolean {
  const path = LOCAL_AUDIO[key];
  if (!path) return false;

  stopElevenLabsSpeech();

  // Use cached audio if available (instant playback), otherwise create new
  let audio: HTMLAudioElement;
  if (preloadCache.has(key)) {
    audio = preloadCache.get(key)!;
    preloadCache.delete(key); // Remove from cache (one-time use)
    audio.currentTime = 0;
  } else {
    audio = new Audio(path);
  }
  currentAudio = audio;

  audio.onplay = () => onStart?.();
  audio.onended = () => { onEnd?.(); currentAudio = null; };
  audio.onerror = () => { onEnd?.(); currentAudio = null; };

  audio.play().catch((err) => {
    console.warn('[TAYTRACK] Audio play blocked (likely autoplay policy):', err?.message);
    onEnd?.();
    currentAudio = null;
  });
  return true;
}

/**
 * Play the full narration for a POI (fun fact + DYK + history combined).
 */
export function playPOIAudio(
  poiId: string,
  onStart?: () => void,
  onEnd?: () => void,
): boolean {
  const fullKey = POI_FULL_AUDIO[poiId];
  if (fullKey) return playLocalAudio(fullKey, onStart, onEnd);
  return false;
}

/**
 * Play a city arrival narration.
 */
export function playArrivalAudio(
  cityId: string,
  onStart?: () => void,
  onEnd?: () => void,
): boolean {
  return playLocalAudio(`arrive-${cityId}`, onStart, onEnd);
}

// Travel segment narration keys
const TRAVEL_AUDIO: Record<string, string> = {
  'vancouver-seattle': 'flight-vancouver-seattle',
  'seattle-tulsa': 'flight-seattle-tulsa',
  'tulsa-lincoln': 'drive-tulsa-lincoln',
  'lincoln-roca': 'drive-lincoln-roca',
  'roca-omaha': 'drive-roca-omaha',
  // Return flight handled separately with chained VOs — see AdventureMap
  // 'omaha-vancouver-return': handled in component
};

/**
 * Play the in-flight/driving narration for a travel segment.
 */
export function playTravelAudio(
  fromCity: string,
  toCity: string,
  onStart?: () => void,
  onEnd?: () => void,
): boolean {
  const key = TRAVEL_AUDIO[`${fromCity}-${toCity}`];
  if (key) return playLocalAudio(key, onStart, onEnd);
  return false;
}

export function stopElevenLabsSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
}

/**
 * Speak text — tries local audio first, then falls back to browser TTS.
 * For POI facts, use playPOIAudio() instead for the pre-generated version.
 */
export function speakText(
  text: string,
  _voiceType: VoiceType = 'narrator',
  onStart?: () => void,
  onEnd?: () => void,
) {
  // Fallback to browser TTS for text that doesn't have pre-generated audio
  stopElevenLabsSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}
