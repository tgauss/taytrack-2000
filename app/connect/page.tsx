'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Message {
  text: string;
  time: string;
  timestamp: string;
  hasImage: boolean;
  imageUrl?: string;
  fromDad: boolean;
}

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
      if (data.ok) setMessages((data.messages || []).map((m: Message) => ({ ...m, fromDad: true })).reverse());
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {}
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const c = canvasRef.current;
    c.width = videoRef.current.videoWidth;
    c.height = videoRef.current.videoHeight;
    c.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    streamRef.current?.getTracks().forEach(t => t.stop());
    sendMessage('', c.toDataURL('image/jpeg', 0.8));
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
              className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">👨</span>
                <div className="flex-1">
                  <p className="text-base text-white/85 leading-relaxed">{msg.text}</p>
                  {msg.hasImage && msg.imageUrl && (
                    <img src={msg.imageUrl} alt="" className="mt-2 rounded-xl max-h-52 object-cover" />
                  )}
                  <p className="text-xs text-white/25 mt-2">{msg.time}</p>
                </div>
              </div>
              {msg.text && (
                <button
                  onClick={() => readAloud(msg.text)}
                  className="mt-2 w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/25 rounded-xl font-bold text-sm text-purple-300 touch-manipulation flex items-center justify-center gap-2"
                >
                  🔊 Read it to me!
                </button>
              )}
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

        {/* Camera / Recording overlays */}
        {cameraActive && (
          <div className="px-4 pb-4 text-center">
            <div className="rounded-2xl overflow-hidden mb-3 bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[30vh] object-cover" />
            </div>
            <button onClick={takePhoto} className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center touch-manipulation">
              <div className="w-12 h-12 bg-white border-4 border-slate-900 rounded-full" />
            </button>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {recording && (
          <div className="px-4 pb-4 text-center">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-5xl mb-3">🎤</motion.div>
            <button onClick={stopRecording} className="px-8 py-3 bg-red-500 text-white font-bold rounded-full touch-manipulation">⏹️ Done!</button>
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
