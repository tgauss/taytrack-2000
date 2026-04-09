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

// Quick message stickers kids can send with one tap
const QUICK_MESSAGES = [
  { emoji: '❤️', text: 'I love you Dad!' },
  { emoji: '😴', text: 'Good night Dad!' },
  { emoji: '🤗', text: 'I miss you!' },
  { emoji: '🎉', text: 'Have fun today!' },
  { emoji: '👋', text: 'Hi Dad!' },
  { emoji: '💪', text: 'You can do it Dad!' },
];

export function KiddoConnect({ isOpen, onClose }: KiddoConnectProps) {
  const [dadMessages, setDadMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState<'main' | 'stickers' | 'photo' | 'voice'>('main');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch Dad's messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/slack/messages');
      const data = await res.json();
      if (data.ok) setDadMessages(data.messages || []);
    } catch { /* silently fail */ }
  }, []);

  // Poll for new messages every 15 seconds when open
  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [isOpen, fetchMessages]);

  // Cleanup camera on close
  useEffect(() => {
    if (!isOpen && streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
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
      setTimeout(() => setSent(false), 2000);
    } catch { /* silently fail */ }
    setSending(false);
    setMode('main');
  };

  const handleQuickMessage = (msg: typeof QUICK_MESSAGES[0]) => {
    soundManager.tap();
    sendMessage(`${msg.emoji} ${msg.text}`);
  };

  // Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setMode('photo');
    } catch { alert('Camera not available'); }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    streamRef.current?.getTracks().forEach(t => t.stop());
    sendMessage('', base64);
  };

  // Voice recording
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
      setMode('voice');
    } catch { alert('Microphone not available'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleClose = () => {
    soundManager.tap();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setMode('main');
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
              <div className="px-5 pt-5 pb-3 text-center">
                <span className="text-4xl mb-2 block">💌</span>
                <h2 className="text-2xl font-bold text-white">Talk to Dad!</h2>
                <p className="text-sm text-white/40 mt-1">Send messages, photos, or voice notes</p>
              </div>

              {/* Sent confirmation */}
              <AnimatePresence>
                {sent && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-center py-3">
                    <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">✅ Sent to Dad!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ maxHeight: '55vh' }}>

                {/* Main mode — action buttons */}
                {mode === 'main' && (
                  <div className="space-y-4">
                    {/* Quick sticker messages */}
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Quick Messages</p>
                      <div className="grid grid-cols-3 gap-2">
                        {QUICK_MESSAGES.map((msg, i) => (
                          <motion.button
                            key={i}
                            onClick={() => handleQuickMessage(msg)}
                            disabled={sending}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-center touch-manipulation disabled:opacity-50"
                            whileTap={{ scale: 0.93 }}
                          >
                            <span className="text-2xl block mb-1">{msg.emoji}</span>
                            <span className="text-[11px] text-white/60">{msg.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Media buttons */}
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Send More</p>
                      <div className="flex gap-3">
                        <motion.button
                          onClick={startCamera}
                          disabled={sending}
                          className="flex-1 p-4 bg-blue-500/15 border-2 border-blue-500/25 rounded-2xl text-center touch-manipulation"
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-3xl block mb-1">📸</span>
                          <span className="text-sm font-bold text-blue-400">Photo</span>
                        </motion.button>
                        <motion.button
                          onClick={startRecording}
                          disabled={sending}
                          className="flex-1 p-4 bg-red-500/15 border-2 border-red-500/25 rounded-2xl text-center touch-manipulation"
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-3xl block mb-1">🎤</span>
                          <span className="text-sm font-bold text-red-400">Voice</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Dad's messages */}
                    {dadMessages.length > 0 && (
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wide mb-2">From Dad 💕</p>
                        <div className="space-y-2">
                          {dadMessages.map((msg, i) => (
                            <div key={i} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                              <p className="text-sm text-white/80">{msg.text}</p>
                              {msg.hasImage && msg.imageUrl && (
                                <img src={msg.imageUrl} alt="" className="mt-2 rounded-lg max-h-40 object-cover" />
                              )}
                              <p className="text-xs text-white/30 mt-1">{msg.time}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Camera mode */}
                {mode === 'photo' && (
                  <div className="text-center">
                    <div className="rounded-2xl overflow-hidden mb-4 bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[35vh] object-cover" />
                    </div>
                    <motion.button
                      onClick={takePhoto}
                      className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg touch-manipulation"
                      whileTap={{ scale: 0.85 }}
                    >
                      <div className="w-16 h-16 bg-white border-4 border-slate-900 rounded-full" />
                    </motion.button>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}

                {/* Voice recording mode */}
                {mode === 'voice' && (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-7xl mb-6"
                    >
                      🎤
                    </motion.div>
                    <p className="text-xl font-bold text-red-400 mb-6">Recording...</p>
                    <motion.button
                      onClick={stopRecording}
                      className="px-10 py-5 bg-red-500 text-white font-bold text-xl rounded-full touch-manipulation"
                      whileTap={{ scale: 0.95 }}
                      animate={{ boxShadow: ['0 0 20px rgba(239,68,68,0.3)', '0 0 40px rgba(239,68,68,0.6)', '0 0 20px rgba(239,68,68,0.3)'] }}
                      transition={{ boxShadow: { duration: 1, repeat: Infinity } }}
                    >
                      ⏹️ Done!
                    </motion.button>
                  </div>
                )}

                {/* Sending indicator */}
                {sending && (
                  <div className="text-center py-8">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-5xl mb-4">
                      📨
                    </motion.div>
                    <p className="text-lg text-white/60">Sending to Dad...</p>
                  </div>
                )}
              </div>

              {/* Bottom bar */}
              <div className="p-4 border-t border-white/5">
                <button onClick={handleClose} className="w-full py-3 bg-white/5 text-white/50 rounded-xl font-medium text-sm touch-manipulation">
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
