'use client';

// ElevenLabs voice integration with caching
// Uses different voice characters per content type

// Voice IDs from ElevenLabs (pre-made voices)
const VOICES = {
  narrator: '21m00Tcm4TlvDq8ikWAM',   // Rachel - warm, clear narrator
  excited: 'EXAVITQu4vr4xnSDxMaL',     // Bella - young, energetic
  storyteller: 'pNInz6obpgDQGcFmaJgB',  // Adam - deep, warm storyteller
} as const;

export type VoiceType = keyof typeof VOICES;

const API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// In-memory audio cache to avoid re-generating the same text
const audioCache = new Map<string, ArrayBuffer>();

// Currently playing audio
let currentAudio: HTMLAudioElement | null = null;

function getApiKey(): string | null {
  return process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null;
}

export function isElevenLabsAvailable(): boolean {
  return !!getApiKey();
}

export async function speakWithElevenLabs(
  text: string,
  voiceType: VoiceType = 'narrator',
  onStart?: () => void,
  onEnd?: () => void,
): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;

  // Stop any currently playing audio
  stopElevenLabsSpeech();

  const voiceId = VOICES[voiceType];
  const cacheKey = `${voiceId}:${text}`;

  try {
    let audioBuffer: ArrayBuffer;

    // Check cache first
    if (audioCache.has(cacheKey)) {
      audioBuffer = audioCache.get(cacheKey)!;
    } else {
      // Call ElevenLabs API
      const response = await fetch(`${API_URL}/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        console.error('[TAYTRACK] ElevenLabs API error:', response.status, await response.text());
        return false;
      }

      audioBuffer = await response.arrayBuffer();
      // Cache it
      audioCache.set(cacheKey, audioBuffer);
    }

    // Play the audio
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onplay = () => onStart?.();
    audio.onended = () => {
      onEnd?.();
      URL.revokeObjectURL(url);
      currentAudio = null;
    };
    audio.onerror = () => {
      onEnd?.();
      URL.revokeObjectURL(url);
      currentAudio = null;
    };

    await audio.play();
    return true;
  } catch (error) {
    console.error('[TAYTRACK] ElevenLabs error:', error);
    onEnd?.();
    return false;
  }
}

export function stopElevenLabsSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  // Also stop browser TTS as fallback
  window.speechSynthesis?.cancel();
}

// Fallback to browser TTS if ElevenLabs is not available
export function speakText(
  text: string,
  voiceType: VoiceType = 'narrator',
  onStart?: () => void,
  onEnd?: () => void,
) {
  if (isElevenLabsAvailable()) {
    speakWithElevenLabs(text, voiceType, onStart, onEnd);
  } else {
    // Browser TTS fallback
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }
}
