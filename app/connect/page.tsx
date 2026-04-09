'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
  const [recording, setRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [tapbackTarget, setTapbackTarget] = useState<string | null>(null);
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

  const sendMessage = async (text: string, imageBase64?: string, audioBase64?: string) => {
    setSending(true);
    try {
      await fetch('/api/slack/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, imageBase64, audioBase64, senderName: 'The Kids 💕' }),
      });
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      fetchMessages();
    } catch {}
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
    // Use actual video dimensions, fallback to reasonable defaults
    c.width = video.videoWidth || 640;
    c.height = video.videoHeight || 480;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, c.width, c.height);
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    sendMessage('📸', dataUrl);
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
        reader.onloadend = () => sendMessage('', undefined, reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {}
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-indigo-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/game" className="text-sm text-white/50">← Game</Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">💌</span>
            <h1 className="text-base font-bold">Kiddo Connect</h1>
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
              <p className="text-sm text-white/30 mt-1">Send Dad a message or wait for his reply</p>
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
                      ? 'bg-green-500 rounded-2xl rounded-br-md'
                      : 'bg-white/10 rounded-2xl rounded-bl-md'
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
                      <p className={`text-[15px] leading-relaxed ${msg.fromKids ? 'text-white' : 'text-white/90'}`}>
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
                        className="w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-xl font-bold text-xs text-white/60 touch-manipulation flex items-center justify-center gap-1.5"
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

        {/* Sent confirmation */}
        <AnimatePresence>
          {sent && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center py-2">
              <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">✅ Sent to Dad!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera — full screen takeover */}
        {cameraActive && (
          <div className="flex-1 flex flex-col bg-black">
            <div className="flex-1 relative overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="bg-slate-950 py-6 flex items-center justify-center gap-8">
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

        {/* Voice recording — big and clear */}
        {recording && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 px-8">
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-8xl mb-8">🎤</motion.div>
            <p className="text-2xl font-bold text-red-400 mb-8">Recording your message...</p>
            <motion.button
              onClick={stopRecording}
              className="px-12 py-5 bg-red-500 text-white font-bold text-xl rounded-full touch-manipulation"
              whileTap={{ scale: 0.95 }}
              animate={{ boxShadow: ['0 0 20px rgba(239,68,68,0.3)', '0 0 40px rgba(239,68,68,0.6)', '0 0 20px rgba(239,68,68,0.3)'] }}
              transition={{ boxShadow: { duration: 1, repeat: Infinity } }}
            >
              ⏹️ Send it!
            </motion.button>
          </div>
        )}

        {sending && (
          <div className="text-center py-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-3xl mb-2">📨</motion.div>
            <p className="text-sm text-white/50">Sending...</p>
          </div>
        )}

        {/* Bottom input area */}
        {!cameraActive && !recording && !sending && (
          <div className="border-t border-white/10 bg-slate-950/90 backdrop-blur-lg p-3 space-y-3">
            {/* Quick messages row */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {QUICK_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(`${msg.emoji} ${msg.text}`)}
                  className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm touch-manipulation hover:bg-white/10 whitespace-nowrap"
                >
                  {msg.emoji} {msg.text}
                </button>
              ))}
            </div>

            {/* Media buttons */}
            <div className="flex gap-2">
              <button onClick={startCamera} className="flex-1 py-3 bg-blue-500/15 border border-blue-500/25 rounded-xl font-bold text-sm text-blue-400 touch-manipulation">
                📸 Photo
              </button>
              <button onClick={startRecording} className="flex-1 py-3 bg-red-500/15 border border-red-500/25 rounded-xl font-bold text-sm text-red-400 touch-manipulation">
                🎤 Voice
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
