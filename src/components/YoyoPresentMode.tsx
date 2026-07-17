import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Smartphone, Presentation, QrCode, ShieldAlert, ArrowLeft, ArrowRight, 
  RotateCcw, Power, Eye, MousePointer, HelpCircle, Check, Sparkles, Timer, RefreshCw
} from 'lucide-react';
import { FileItem } from '../types';

interface YoyoPresentModeProps {
  files: FileItem[];
  triggerNotification: (msg: string) => void;
  onBackToDashboard: () => void;
}

export default function YoyoPresentMode({
  files,
  triggerNotification,
  onBackToDashboard
}: YoyoPresentModeProps) {
  const pptxFiles = files.filter(f => !f.is_deleted && (f.filename.endsWith('.pptx') || f.mime_type.includes('presentation') || f.filename.endsWith('.pdf')));

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [autoDelete, setAutoDelete] = useState(true);

  // Presentation State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [laserPointer, setLaserPointer] = useState<{ x: number; y: number; active: boolean }>({ x: 50, y: 50, active: false });
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Slides content templates
  const slidesData = [
    {
      title: "🚀 Welcome to YOYOCLESTA",
      subtitle: "The Future of Smart Board Presentations",
      bullets: [
        "Store Once. Access Anywhere. Present instantly.",
        "Zero setup required — no USB keys or pendrives.",
        "Interactive remote control straight from your mobile phone.",
        "Secure end-to-end cloud encryption framework."
      ],
      footer: "Slide 1 of 4 • Yoyoclesta Core"
    },
    {
      title: "📂 Complete Cloud Vault Isolation",
      subtitle: "Designed for High-Fidelity Enterprise Security",
      bullets: [
        "Apple VisionOS Glassmorphism user interface.",
        "AES-256 client side encryption for maximum safety.",
        "Real-time Firestore synchronization keeps your devices paired.",
        "Fully offline-capable session cache mechanism."
      ],
      footer: "Slide 2 of 4 • Security Platform"
    },
    {
      title: "🤖 Ask Yoyo AI Features",
      subtitle: "Smart Presentation Co-Pilot at Your Fingertips",
      bullets: [
        "OCR text searches documents for metadata and indices.",
        "Chat assistant generates presentation slide highlights instantly.",
        "Automatic file organizing groups files in smart collections.",
        "Natural language commands execute system actions on the fly."
      ],
      footer: "Slide 3 of 4 • Artificial Intelligence"
    },
    {
      title: "🎯 Yoyo Present Mode: Laser Pointer & Timer",
      subtitle: "No Remote Hardware Necessary",
      bullets: [
        "Control slides from any phone without installing apps.",
        "Virtual Laser Pointer casts a visible red marker on TV screens.",
        "Built-in stopwatch tracks presentation timings.",
        "Session auto-destruction clears cache files safely upon completion."
      ],
      footer: "Slide 4 of 4 • Interaction Tools"
    }
  ];

  // Generate a random 6-digit session PIN
  const handleStartSession = (file: FileItem) => {
    setSelectedFile(file);
    const code = Math.floor(100000 + Math.random() * 900000).toString().replace(/(\d{3})(\d{3})/, '$1-$2');
    setSessionCode(code);
    setSessionActive(true);
    setCurrentSlide(0);
    setTimerSeconds(0);
    setTimerRunning(true);
    triggerNotification(`Yoyo Present Mode active for "${file.filename}"`);
  };

  const handleEndSession = () => {
    setSessionActive(false);
    setTimerRunning(false);
    if (autoDelete) {
      triggerNotification("Session data safely auto-deleted from cloud cache.");
    } else {
      triggerNotification("Presentation session closed.");
    }
    setSelectedFile(null);
  };

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60).toString().padStart(2, '0');
    const secs = (sec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Laser Touchpad handler
  const handleTouchpadMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setLaserPointer({ x, y, active: true });
  };

  const handleTouchpadLeave = () => {
    setLaserPointer(prev => ({ ...prev, active: false }));
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-white select-none text-left">
      
      {/* 1. Header Row */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-indigo-500 font-sans tracking-wide">SIGNATURE FLAGSHIP</span>
          <h1 className="text-2xl font-display font-bold tracking-tight">Yoyo Present Mode</h1>
          <p className="text-xs text-slate-500">Present slideshows instantly on any screen using your phone as a laser pointer.</p>
        </div>
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          Back to Vault
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!sessionActive ? (
          /* Selection Dashboard */
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Guide Card */}
            <div className="md:col-span-4 glass-panel rounded-[28px] border border-white/45 p-6 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/15">
                  <Presentation className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Presenter setup guide</h3>
                <ol className="text-xs text-slate-500 space-y-2.5 list-decimal pl-4 leading-relaxed">
                  <li>Select a PowerPoint presentation (.pptx) or PDF file from the list.</li>
                  <li>Click <strong>Start Session</strong> to spin up an interactive session code.</li>
                  <li>Scan the QR code with your mobile phone to lock in as a controller.</li>
                  <li>Go Fullscreen on the smart board. Touch to laser-point and flip slides!</li>
                </ol>
              </div>

              {/* Security parameters */}
              <div className="p-3.5 rounded-2xl bg-white/10 dark:bg-slate-950/20 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Auto Delete Session</span>
                  <input
                    type="checkbox"
                    checked={autoDelete}
                    onChange={(e) => setAutoDelete(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Destroy cloud remote routes instantly once you end the presentation.</p>
              </div>
            </div>

            {/* Files selection table */}
            <div className="md:col-span-8 glass-panel rounded-[28px] border border-white/45 p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Presentation File</h3>
              
              {pptxFiles.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <ShieldAlert className="w-10 h-10 mx-auto text-indigo-500 opacity-60" />
                  <p className="text-xs font-bold">No PowerPoint decks found in vault.</p>
                  <p className="text-[10px] max-w-xs mx-auto">Upload any slide deck or text files in the main dashboard to start presenting!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {pptxFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-white/25 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                          <Presentation className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block text-xs font-bold truncate max-w-[240px] md:max-w-md">{f.filename}</span>
                          <span className="text-[10px] font-mono text-slate-400">{(f.file_size / (1024 * 1024)).toFixed(2)} MB • PPTX</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartSession(f)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                        Start Session
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Live Dual Simulation Panel: Smart Board + Phone Remote side by side! */
          <motion.div
            key="live-session"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Left Column: Simulated TV / Classroom Smart Board Display */}
            <div className="lg:col-span-8 flex flex-col justify-between p-6 bg-slate-950 rounded-[32px] border border-white/10 text-white shadow-2xl relative overflow-hidden min-h-[460px]">
              
              {/* Refraction background light inside Smart Board */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/40 -z-10" />

              {/* Floating Laser Pointer dot on smart board */}
              {laserPointer.active && (
                <div 
                  className="absolute w-6 h-6 rounded-full bg-red-500 border border-white shadow-[0_0_15px_#ef4444] transition-all duration-75 pointer-events-none -translate-x-1/2 -translate-y-1/2 z-40"
                  style={{ left: `${laserPointer.x}%`, top: `${laserPointer.y}%` }}
                >
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
                </div>
              )}

              {/* Smart Board Header Bar */}
              <div className="flex justify-between items-center shrink-0 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow" />
                  <span className="text-[10px] font-bold uppercase font-mono text-emerald-400 tracking-wider">YOYO LIVE SMARTBOARD DISPLAY</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="bg-white/10 px-2.5 py-1 rounded-md border border-white/5 flex items-center gap-1.5 text-slate-300">
                    <Smartphone className="w-3.5 h-3.5" /> Phone Paired
                  </span>
                  <span className="text-indigo-300 font-bold font-sans">PIN: {sessionCode}</span>
                </div>
              </div>

              {/* Active Slide Body Frame with Slide transitions */}
              <div className="flex-1 flex flex-col justify-center text-center max-w-xl mx-auto py-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono block">
                      {slidesData[currentSlide].subtitle}
                    </span>
                    <h2 className="text-3xl font-display font-black leading-tight text-[#ebd2b4]">
                      {slidesData[currentSlide].title}
                    </h2>
                    
                    <ul className="text-xs text-slate-300 space-y-3.5 max-w-md mx-auto text-left list-none pt-4">
                      {slidesData[currentSlide].bullets.map((bullet, bidx) => (
                        <li key={bidx} className="flex gap-2.5 items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Smart Board Footer */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-white/10 pt-4 shrink-0">
                <span>{slidesData[currentSlide].footer}</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Timer className="w-3.5 h-3.5" /> Session time: {formatTimer(timerSeconds)}
                </span>
              </div>
            </div>

            {/* Right Column: Simulated Mobile Phone Remote Controller Device mockup */}
            <div className="lg:col-span-4 flex flex-col justify-between p-5 bg-slate-900 border-4 border-slate-700 rounded-[44px] shadow-2xl relative max-w-sm mx-auto w-full text-white overflow-hidden select-none min-h-[460px]">
              
              {/* Speaker pill notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>

              <div className="flex flex-col flex-1 justify-between mt-5 pt-4">
                
                {/* Phone Header Info */}
                <div className="text-center space-y-1">
                  <span className="text-[9px] font-bold font-mono text-indigo-400 block tracking-widest">YOYO REMOTE SYSTEM</span>
                  <h4 className="text-xs font-bold leading-tight text-[#ebd2b4] truncate max-w-[200px] mx-auto">
                    {selectedFile?.filename}
                  </h4>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Linked to Smart Board PIN {sessionCode}
                  </div>
                </div>

                {/* Laser Pointer Touchpad area */}
                <div className="my-4 space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MousePointer className="w-3 h-3 text-red-500" /> Virtual Touchpad
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">Drag to Laser Point</span>
                  </div>
                  <div
                    onMouseMove={handleTouchpadMove}
                    onMouseLeave={handleTouchpadLeave}
                    className="aspect-[1.5] rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-center cursor-crosshair hover:bg-slate-900/50 transition-colors relative"
                  >
                    <div className="space-y-1 opacity-40">
                      <div className="w-5 h-5 rounded-full border-2 border-red-500 mx-auto flex items-center justify-center text-red-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      </div>
                      <span className="text-[8px] block font-mono">Move mouse here to project laser pointer</span>
                    </div>

                    {/* Finger touch feedback dot */}
                    {laserPointer.active && (
                      <div 
                        className="absolute w-4 h-4 rounded-full bg-indigo-500/40 border border-indigo-400 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${laserPointer.x}%`, top: `${laserPointer.y}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Primary Slide Flipper controls */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <button
                    onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                    disabled={currentSlide === 0}
                    className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-30 border border-white/5 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-indigo-400" />
                    <span>Prev Slide</span>
                  </button>
                  
                  <button
                    onClick={() => setCurrentSlide(prev => Math.min(slidesData.length - 1, prev + 1))}
                    disabled={currentSlide === slidesData.length - 1}
                    className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-30 border border-white/5 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                    <span>Next Slide</span>
                  </button>
                </div>

                {/* Timer Control & Stop Button */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-mono font-bold text-slate-400">Presentation Timer</span>
                    <span className="text-sm font-mono font-bold text-slate-200">{formatTimer(timerSeconds)}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        timerRunning 
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                          : 'bg-emerald-600/25 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {timerRunning ? "Pause" : "Resume"}
                    </button>
                    
                    <button
                      onClick={() => setTimerSeconds(0)}
                      className="py-1.5 px-2 rounded-xl bg-white/10 border border-white/5 hover:bg-white/15 text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
                    >
                      Reset
                    </button>

                    <button
                      onClick={handleEndSession}
                      className="py-1.5 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 text-[10px] font-bold text-rose-300 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <Power className="w-3 h-3 text-rose-400" />
                      Exit
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Phone Indicator pill */}
              <div className="w-24 h-1.5 bg-slate-800 rounded-full mx-auto mt-4 shrink-0" />
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
