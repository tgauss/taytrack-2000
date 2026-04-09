'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/lib/sounds';

interface Message {
  text: string;
  time: string;
  hasImage: boolean;
  imageUrl?: string;
}

interface KiddoConnectProps {
  isOpen: boolean;
  onClose: () => void;
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

export function KiddoConnect({ isOpen, onClose }: KiddoConnectProps) {
  const [dadMessages, setDadMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [tab, setTab] = useState<'send' | 'dad'>('dad');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/slack/messages');
      const data = await res.json();
      if (data.ok) setDadMessages(data.messages || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 12000);
    return () => clearInterval(interval);
  }, [isOpen, fetchMessages]);

  useEffect(() => {
    if (!isOpen && streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  }, [isOpen]);

  const sendMessage = async (text: string, imageBase64?: string, audioBase64?: string) => {
    setSending(true);
    try {
      await fetch('/api/slack/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, imageBase64, audioBase64, senderName: 'The Kids 💕' }),
      });
      setSent(true);
      soundManager.success();
      setTimeout(() => setSent(false), 2500);
    } catch {}
    setSending(false);
    setCameraActive(false);
  };

  const handleQuickMessage = (msg: typeof QUICK_MESSAGES[0]) => {
    soundManager.tap();
    sendMessage(`${msg.emoji} ${msg.text}`);
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
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    streamRef.current?.getTracks().forEach(t => t.stop());
    sendMessage('', base64);
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

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleClose = () => {
    soundManager.tap();
    window.speechSynthesis.cancel();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
    setRecording(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="absolute bottom-0 left-0 right-0 max-h-[88vh] flex flex-col"
          >
            <div className="bg-slate-900 rounded-t-[28px] flex flex-col overflow-hidden border-t border-white/10 shadow-2xl">

              {/* Header */}
              <div className="px-5 pt-4 pb-2 text-center">
                <span className="text-3xl">💌</span>
                <h2 className="text-xl font-bold text-white">Kiddo Connect</h2>
              </div>

              {/* Tab switcher */}
              <div className="flex mx-5 mb-3 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => { soundManager.tap(); setTab('dad'); }}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm touch-manipulation transition-all ${
                    tab === 'dad' ? 'bg-purple-500 text-white' : 'text-white/50'
                  }`}
                >
                  💕 From Dad {dadMessages.length > 0 && <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{dadMessages.length}</span>}
                </button>
                <button
                  onClick={() => { soundManager.tap(); setTab('send'); }}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm touch-manipulation transition-all ${
                    tab === 'send' ? 'bg-cyan-500 text-white' : 'text-white/50'
                  }`}
                >
                  📤 Send to Dad
                </button>
              </div>

              {/* Sent confirmation */}
              <AnimatePresence>
                {sent && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-center py-2">
                    <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">✅ Sent to Dad!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ maxHeight: '55vh' }}>

                {/* ===== FROM DAD TAB ===== */}
                {tab === 'dad' && (
                  <div className="space-y-3">
                    {dadMessages.length === 0 ? (
                      <div className="text-center py-10">
                        <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl block mb-4">📭</motion.span>
                        <p className="text-lg text-white/50">No messages from Dad yet!</p>
                        <p className="text-sm text-white/30 mt-1">When Dad sends a message, it will show up here</p>
                      </div>
                    ) : (
                      dadMessages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="bg-purple-500/10 border-2 border-purple-500/20 rounded-2xl p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">👨</span>
                            <div className="flex-1">
                              <p className="text-base text-white/85 leading-relaxed">{msg.text}</p>
                              {msg.hasImage && msg.imageUrl && (
                                <img src={msg.imageUrl} alt="" className="mt-3 rounded-xl max-h-48 object-cover w-full" />
                              )}
                              <p className="text-xs text-white/30 mt-2">{msg.time}</p>
                            </div>
                          </div>

                          {/* Read it to me button — BIG and obvious */}
                          {msg.text && (
                            <motion.button
                              onClick={() => { soundManager.tap(); readAloud(msg.text); }}
                              className="mt-3 w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl font-bold text-base text-purple-300 touch-manipulation flex items-center justify-center gap-2 transition-colors"
                              whileTap={{ scale: 0.96 }}
                            >
                              🔊 Read it to me!
                            </motion.button>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {/* ===== SEND TO DAD TAB ===== */}
                {tab === 'send' && !cameraActive && !recording && (
                  <div className="space-y-4">
                    {/* Quick sticker messages */}
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Tap to send!</p>
                      <div className="grid grid-cols-3 gap-2">
                        {QUICK_MESSAGES.map((msg, i) => (
                          <motion.button
                            key={i}
                            onClick={() => handleQuickMessage(msg)}
                            disabled={sending}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-center touch-manipulation disabled:opacity-50"
                            whileTap={{ scale: 0.9 }}
                          >
                            <span className="text-3xl block mb-1">{msg.emoji}</span>
                            <span className="text-xs text-white/60 font-medium">{msg.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Media buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        onClick={startCamera}
                        disabled={sending}
                        className="flex-1 p-5 bg-blue-500/15 border-2 border-blue-500/25 rounded-2xl text-center touch-manipulation"
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-4xl block mb-2">📸</span>
                        <span className="text-sm font-bold text-blue-400">Take a Photo</span>
                      </motion.button>
                      <motion.button
                        onClick={startRecording}
                        disabled={sending}
                        className="flex-1 p-5 bg-red-500/15 border-2 border-red-500/25 rounded-2xl text-center touch-manipulation"
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-4xl block mb-2">🎤</span>
                        <span className="text-sm font-bold text-red-400">Voice Message</span>
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Camera mode */}
                {cameraActive && (
                  <div className="text-center">
                    <div className="rounded-2xl overflow-hidden mb-4 bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[35vh] object-cover" />
                    </div>
                    <motion.button onClick={takePhoto} whileTap={{ scale: 0.85 }}
                      className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg touch-manipulation">
                      <div className="w-16 h-16 bg-white border-4 border-slate-900 rounded-full" />
                    </motion.button>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}

                {/* Voice recording */}
                {recording && (
                  <div className="text-center py-8">
                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-7xl mb-6">🎤</motion.div>
                    <p className="text-xl font-bold text-red-400 mb-6">Recording...</p>
                    <motion.button onClick={stopRecording} whileTap={{ scale: 0.95 }}
                      className="px-10 py-5 bg-red-500 text-white font-bold text-xl rounded-full touch-manipulation"
                      animate={{ boxShadow: ['0 0 20px rgba(239,68,68,0.3)', '0 0 40px rgba(239,68,68,0.6)', '0 0 20px rgba(239,68,68,0.3)'] }}
                      transition={{ boxShadow: { duration: 1, repeat: Infinity } }}>
                      ⏹️ Done!
                    </motion.button>
                  </div>
                )}

                {sending && (
                  <div className="text-center py-8">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-5xl mb-4">📨</motion.div>
                    <p className="text-lg text-white/60">Sending to Dad...</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5">
                <button onClick={handleClose} className="w-full py-3 bg-white/5 text-white/50 rounded-xl font-medium text-sm touch-manipulation">Close</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export a hook to check for new messages (for notification badge on map)
export function useNewMessages() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/slack/messages');
        const data = await res.json();
        if (data.ok) setCount(data.messages?.length || 0);
      } catch {}
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);
  return count;
}
