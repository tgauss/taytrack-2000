'use client';

// Sound URLs - using Web Audio API generated tones for reliability
// No external dependencies needed

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  
  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }
  
  setMuted(muted: boolean) {
    this.isMuted = muted;
  }
  
  // Play a simple tone
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (this.isMuted) return;
    
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Audio not available
    }
  }
  
  // Play a sequence of tones
  private playSequence(notes: { freq: number; dur: number }[], type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    
    let delay = 0;
    notes.forEach(note => {
      setTimeout(() => this.playTone(note.freq, note.dur, type), delay * 1000);
      delay += note.dur * 0.8;
    });
  }
  
  // UI tap sound - short pop
  tap() {
    this.playTone(800, 0.08, 'sine', 0.2);
  }
  
  // Success/correct sound - ascending happy tones
  success() {
    this.playSequence([
      { freq: 523, dur: 0.1 }, // C5
      { freq: 659, dur: 0.1 }, // E5
      { freq: 784, dur: 0.15 }, // G5
    ]);
  }
  
  // Achievement fanfare - triumphant melody
  fanfare() {
    this.playSequence([
      { freq: 523, dur: 0.15 }, // C5
      { freq: 659, dur: 0.15 }, // E5
      { freq: 784, dur: 0.15 }, // G5
      { freq: 1047, dur: 0.3 }, // C6
    ]);
  }
  
  // Whoosh for plane takeoff
  whoosh() {
    if (this.isMuted) return;
    
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(100, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio not available
    }
  }
  
  // Vroom for car driving
  vroom() {
    if (this.isMuted) return;
    
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(80, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not available
    }
  }
  
  // Gentle miss sound
  whoops() {
    this.playSequence([
      { freq: 400, dur: 0.1 },
      { freq: 300, dur: 0.15 },
    ], 'triangle');
  }
  
  // Arrival ding
  arrive() {
    this.playSequence([
      { freq: 880, dur: 0.1 },
      { freq: 1100, dur: 0.2 },
    ]);
  }
  
  // Pop for boxes/items
  pop() {
    this.playTone(600, 0.05, 'square', 0.15);
    setTimeout(() => this.playTone(800, 0.05, 'square', 0.1), 50);
  }
  
  // Counting sound
  count() {
    this.playTone(660, 0.08, 'sine', 0.2);
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Hook for components
export const useSound = () => {
  return soundManager;
};
