'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { LiveSky } from '@/components/game/LiveSky';

const MAX_MESSAGES_PER_SESSION = 20;
const SESSION_KEY = 'taytrack-msg-count';

interface Reaction {
  emoji: string;
  count: number;
}

interface Message {
  text: string;
  time: string;
  timestamp: string;
  hasImage: boolean;
  imageUrl?: string;
  hasAudio: boolean;
  fromDad: boolean;
  fromKids: boolean;
  reactions: Reaction[];
}

const TAPBACK_EMOJIS = ['❤️', '👍', '😂', '🎉', '😍'];

const QUICK_MESSAGES = [
  { emoji: '❤️', text: 'I love you Dad!' },
  { emoji: '😴', text: 'Good night Dad!' },
  { emoji: '🤗', text: 'I miss you!' },
  { emoji: '🎉', text: 'Have fun today!' },
  { emoji: '👋', text: 'Hi Dad!' },
  { emoji: '💪', text: 'You can do it Dad!' },
];

function readAloud(text: string) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

export default function ConnectPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [recording, setRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [tapbackTarget, setTapbackTarget] = useState<string | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const atLimit = msgCount >= MAX_MESSAGES_PER_SESSION;

  // Track message count per session
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setMsgCount(parseInt(stored, 10));
  }, []);
  const incrementMsgCount = () => {
    const next = msgCount + 1;
    setMsgCount(next);
    sessionStorage.setItem(SESSION_KEY, String(next));
  };
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = (timestamp: string) => {
    longPressTimer.current = setTimeout(() => setTapbackTarget(timestamp), 400);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };
  const sendReaction = async (emoji: string, messageTimestamp: string) => {
    setTapbackTarget(null);
    try {
      await fetch('/api/slack/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, messageTimestamp }),
      });
      fetchMessages();
    } catch {}
  };
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/slack/messages');
      const data = await res.json();
      if (data.ok) setMessages(data.messages || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup camera/mic on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current?.stop();
    };
  }, []);

  const sendMessage = async (text: string, imageBase64?: string, audioBase64?: string) => {
    if (atLimit) return;
    setSending(true);
    setSendError(false);
    try {
      const res = await fetch('/api/slack/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, imageBase64, audioBase64, senderName: 'The Kids 💕' }),
      });
      const data = await res.json();
      if (data.ok) {
        incrementMsgCount();
        setSent(true);
        setTimeout(() => setSent(false), 2000);
        fetchMessages();
      } else {
        setSendError(true);
        setTimeout(() => setSendError(false), 3000);
      }
    } catch {
      setSendError(true);
      setTimeout(() => setSendError(false), 3000);
    }
    setSending(false);
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (e) {
      console.error('Camera error:', e);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const c = canvasRef.current;
    // Resize to max 640px to keep file small (avoids Vercel 4.5MB limit)
    const maxSize = 640;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const scale = Math.min(maxSize / vw, maxSize / vh, 1);
    c.width = Math.round(vw * scale);
    c.height = Math.round(vh * scale);
    const ctx = c.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, c.width, c.height);
    streamRef.current?.getTracks().forEach(t => t.stop());
    const dataUrl = c.toDataURL('image/jpeg', 0.6);
    // Show preview instead of immediately sending
    setCameraActive(false);
    setPhotoPreview(dataUrl);
  };

  const sendPhoto = () => {
    if (!photoPreview) return;
    sendMessage('📸', photoPreview);
    setPhotoPreview(null);
  };

  const discardPhoto = () => {
    setPhotoPreview(null);
  };

  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopRef = useRef<NodeJS.Timeout | null>(null);

  const playDictationSound = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
      // Second beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.33);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.33);
    } catch {}
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => sendMessage('🎤', undefined, reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      playDictationSound();
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingTime(15);

      // Countdown timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t <= 1) {
            stopRecording();
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      // Auto-stop after 15 seconds
      autoStopRef.current = setTimeout(() => stopRecording(), 15000);
    } catch {}
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    playDictationSound();
    mediaRecorderRef.current.stop();
    setRecording(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  };

  return (
    <main className="min-h-screen text-white flex flex-col relative">
      {/* Live sky background */}
      <LiveSky />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/game" className="text-sm text-white/50">← Game</Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">💌</span>
            <h1 className="text-xl font-bold">Kiddo Connect</h1>
          </div>
          <Link href="/" className="text-sm text-white/50">Home →</Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl block mb-4">💌</motion.span>
              <p className="text-lg text-white/50">Messages will show up here!</p>
              <p className="text-base text-white/40 mt-1">Send Dad a message or wait for his reply</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={msg.timestamp || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.fromKids ? 'justify-end' : 'justify-start'}`}
            >
              <div className="relative max-w-[75%]">
                <div
                  className={`${
                    msg.fromKids
                      ? 'bg-pink-600 rounded-2xl rounded-br-md'
                      : 'bg-blue-500/80 rounded-2xl rounded-bl-md'
                  }`}
                  onTouchStart={() => handleLongPressStart(msg.timestamp)}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(msg.timestamp)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                >
                  {msg.hasImage && msg.imageUrl && (
                    <div className="p-1">
                      <img src={msg.imageUrl} alt="" className="rounded-xl max-h-56 object-cover w-full" />
                    </div>
                  )}
                  <div className="px-4 py-2.5">
                    {msg.text && (
                      <p className={`text-xl leading-relaxed ${msg.fromKids ? 'text-white' : 'text-white/90'}`}>
                        {msg.text}
                      </p>
                    )}
                    {msg.hasAudio && !msg.text && <p className="text-sm">🎤 Voice message</p>}
                    <p className={`text-[11px] mt-1 ${msg.fromKids ? 'text-white/50' : 'text-white/25'}`}>
                      {msg.time}
                    </p>
                  </div>
                  {msg.fromDad && msg.text && (
                    <div className="px-3 pb-2">
                      <button
                        onClick={() => readAloud(msg.text)}
                        className="w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-bold text-sm text-white/60 touch-manipulation flex items-center justify-center gap-1.5"
                      >
                        🔊 Read it to me!
                      </button>
                    </div>
                  )}
                </div>

                {/* Reactions display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`flex gap-1 mt-1 ${msg.fromKids ? 'justify-end' : 'justify-start'}`}>
                    {msg.reactions.map((r: Reaction, ri: number) => (
                      <span key={ri} className="bg-white/10 rounded-full px-2 py-0.5 text-xs">
                        {r.emoji} {r.count > 1 && r.count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tapback picker */}
                <AnimatePresence>
                  {tapbackTarget === msg.timestamp && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`absolute -top-12 ${msg.fromKids ? 'right-0' : 'left-0'} bg-slate-800 border border-white/20 rounded-full px-2 py-1.5 flex gap-1 shadow-xl z-10`}
                    >
                      {TAPBACK_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => sendReaction(emoji, msg.timestamp)}
                          className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-lg touch-manipulation active:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        onClick={() => setTapbackTarget(null)}
                        className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-xs text-white/40 touch-manipulation"
                      >
                        ✕
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Sent confirmation / Error */}
        <AnimatePresence>
          {sent && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center py-2">
              <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-base font-bold">✅ Sent to Dad!</span>
            </motion.div>
          )}
          {sendError && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center py-2">
              <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-base font-bold">😕 Oops! Try again?</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera — full screen takeover */}
        {cameraActive && (
          <div className="flex-1 flex flex-col bg-black">
            <div className="flex-1 relative overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="bg-slate-950 py-6 flex items-center justify-center gap-8 safe-area-pb">
              <button
                onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setCameraActive(false); }}
                className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-2xl touch-manipulation"
              >
                ✕
              </button>
              <motion.button
                onClick={takePhoto}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg touch-manipulation"
                whileTap={{ scale: 0.85 }}
              >
                <div className="w-16 h-16 bg-white border-4 border-slate-900 rounded-full" />
              </motion.button>
              <div className="w-14 h-14" /> {/* spacer */}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Photo preview — see what you took before sending */}
        {photoPreview && (
          <div className="flex-1 flex flex-col bg-black">
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
              <img src={photoPreview} alt="Your photo" className="max-w-full max-h-full object-contain rounded-2xl" />
            </div>
            <div className="bg-slate-950 py-6 px-6 flex items-center justify-center gap-6">
              <motion.button
                onClick={discardPhoto}
                className="flex-1 py-5 bg-white/10 text-white font-bold text-xl rounded-2xl touch-manipulation"
                whileTap={{ scale: 0.93 }}
              >
                🔄 Retake
              </motion.button>
              <motion.button
                onClick={sendPhoto}
                className="flex-1 py-5 bg-pink-600 text-white font-bold text-xl rounded-2xl touch-manipulation"
                whileTap={{ scale: 0.93 }}
              >
                📸 Send!
              </motion.button>
            </div>
          </div>
        )}

        {/* Voice recording — full screen, unmissable stop button, countdown */}
        {recording && (
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-red-950/50 to-slate-950 px-8">
            {/* Pulsing mic */}
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="relative mb-6"
            >
              <span className="text-8xl">🎤</span>
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)' }}
              />
            </motion.div>

            {/* Countdown */}
            <motion.div
              className="text-5xl font-bold text-white mb-3"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {recordingTime}
            </motion.div>
            <p className="text-lg text-red-300 mb-10">Recording... tap to send!</p>

            {/* BIG stop/send button — entire width, can't miss */}
            <motion.button
              onClick={stopRecording}
              className="w-full max-w-xs py-6 bg-red-500 text-white font-bold text-2xl rounded-2xl touch-manipulation shadow-2xl"
              whileTap={{ scale: 0.93 }}
              animate={{
                boxShadow: ['0 0 30px rgba(239,68,68,0.3)', '0 0 60px rgba(239,68,68,0.6)', '0 0 30px rgba(239,68,68,0.3)'],
              }}
              transition={{ boxShadow: { duration: 1, repeat: Infinity } }}
            >
              ⏹️ SEND IT!
            </motion.button>

            {/* Progress bar */}
            <div className="w-full max-w-xs mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 15, ease: 'linear' }}
              />
            </div>
          </div>
        )}

        {sending && (
          <div className="text-center py-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-3xl mb-2">📨</motion.div>
            <p className="text-sm text-white/50">Sending...</p>
          </div>
        )}

        {/* Rate limit message */}
        {atLimit && (
          <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20 text-center">
            <p className="text-sm text-amber-400">You&apos;ve sent lots of messages! 💕 Take a break and come back later.</p>
          </div>
        )}

        {/* Bottom input area */}
        {!cameraActive && !recording && !sending && !atLimit && (
          <div className="border-t border-white/10 bg-slate-950/90 backdrop-blur-lg p-3 space-y-3">
            {/* Quick messages row */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {QUICK_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(`${msg.emoji} ${msg.text}`)}
                  className="flex-shrink-0 px-5 py-3 bg-white/5 border border-white/10 rounded-full text-base touch-manipulation hover:bg-white/10 whitespace-nowrap"
                >
                  {msg.emoji} {msg.text}
                </button>
              ))}
            </div>

            {/* Media buttons */}
            <div className="flex gap-2">
              <button onClick={startCamera} className="flex-1 py-4 bg-blue-500/15 border border-blue-500/25 rounded-2xl font-bold text-base text-blue-400 touch-manipulation">
                📸 Photo
              </button>
              <button onClick={startRecording} className="flex-1 py-4 bg-red-500/15 border border-red-500/25 rounded-2xl font-bold text-base text-red-400 touch-manipulation">
                🎤 Voice
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
