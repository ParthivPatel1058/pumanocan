import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Cloud, Download, Laptop, ShieldCheck, Sparkles, Smartphone, Eye } from 'lucide-react';
import { AppSettings } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignInClick: () => void;
  settings: AppSettings;
}

export default function LandingPage({ onGetStarted, onSignInClick, settings }: LandingPageProps) {
  const { darkMode } = settings;

  return (
    <div className={`min-h-screen text-slate-800 ${darkMode ? 'text-slate-100' : 'text-slate-800'} transition-colors duration-500`}>
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/80 via-purple-500/60 to-pink-500/50 flex items-center justify-center shadow-lg border border-white/35 backdrop-blur-md">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-100 dark:to-white bg-clip-text text-transparent">
            pumanocan
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            id="nav-signin-btn"
            onClick={onSignInClick}
            className="px-5 py-2 rounded-full font-sans font-medium text-sm transition-all duration-300 hover:bg-white/15 active:scale-95 border border-transparent hover:border-white/20 dark:text-white"
          >
            Sign In
          </button>
          <button 
            id="nav-getstarted-btn"
            onClick={onGetStarted}
            className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-sans font-medium text-sm shadow-md transition-all duration-300"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 dark:bg-slate-900/30 border border-white/40 dark:border-slate-800/40 backdrop-blur-xl text-xs font-semibold tracking-wider uppercase mb-8 text-indigo-700 dark:text-indigo-300 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Classroom & Presentation Companion
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl font-display font-bold tracking-tight mb-6 leading-[1.1] text-slate-900 dark:text-white text-shadow-subtle"
          >
            Your Files. <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Anywhere, Anytime.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl font-sans text-slate-600 dark:text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Upload your slideshows, notes, or PDFs once. Access and download them instantly from classroom PCs, tablets, or phones without carrying a pendrive.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button 
              id="hero-getstarted-btn"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-98 text-white font-sans font-semibold text-base shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button 
              id="hero-signin-btn"
              onClick={onSignInClick}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/25 dark:bg-slate-900/30 hover:bg-white/40 dark:hover:bg-slate-900/55 border border-white/40 dark:border-slate-800/40 backdrop-blur-md text-slate-900 dark:text-white font-sans font-semibold text-base shadow-lg transition-all duration-300 active:scale-98 flex items-center justify-center gap-2"
            >
              Access Vault
              <Eye className="w-4 h-4 text-indigo-500" />
            </button>
          </motion.div>
        </div>

        {/* Floating Mockup Preview Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 60 }}
          className="relative max-w-5xl mx-auto mb-24 rounded-[32px] overflow-hidden glass-panel-heavy shadow-2xl p-4 md:p-6"
        >
          {/* Mock Window Chromes */}
          <div className="flex items-center justify-between pb-4 border-b border-white/20 mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500/85 block shadow-inner" />
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400/85 block shadow-inner" />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/85 block shadow-inner" />
            </div>
            <div className="px-6 py-1 rounded-full bg-white/20 dark:bg-slate-950/20 text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2 border border-white/10">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              https://pumanocan.app/vault/parthiv
            </div>
            <div className="w-14" />
          </div>

          {/* Interactive visual layout mimicking the dashboard screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 opacity-90">
            {/* Left Mock Sidebar */}
            <div className="md:col-span-3 rounded-[24px] bg-white/20 dark:bg-slate-950/20 border border-white/25 p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/80 flex items-center justify-center text-white font-bold">P</div>
                <div>
                  <div className="text-xs font-bold dark:text-white">Cloud PPT Vault</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">Your Vault, Isolated</div>
                </div>
              </div>
              <div className="space-y-1 pt-3">
                {['Dashboard', 'My Presentations', 'Recent', 'Favorites', 'Settings'].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${i === 0 ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 border border-indigo-500/10' : 'text-slate-600 dark:text-slate-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Mock Content Area */}
            <div className="md:col-span-9 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 rounded-[24px] bg-white/30 dark:bg-slate-950/30 border border-white/20 p-5 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-3 border border-indigo-500/10">
                    <Cloud className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-sm font-semibold dark:text-white mb-1">Drag and drop slides here</span>
                  <span className="text-xs text-slate-500">Supports PPTX, PDF, Docx, etc.</span>
                </div>
                <div className="rounded-[24px] bg-white/30 dark:bg-slate-950/30 border border-white/20 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Vault Storage</span>
                    <span className="text-lg font-bold dark:text-white">32% Used</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: '32%' }} />
                  </div>
                  <span className="text-[10px] text-slate-500">3.2 GB of 10 GB</span>
                </div>
              </div>

              {/* Mock Recent files */}
              <div className="rounded-[24px] bg-white/30 dark:bg-slate-950/30 border border-white/20 p-4">
                <div className="text-xs font-bold mb-3 dark:text-white">Recent Files</div>
                <div className="space-y-2">
                  {[
                    { name: 'SDPS Annual Report 2025.pptx', size: '2.4 MB', time: '2 hours ago' },
                    { name: 'Science Project Presentation.pptx', size: '5.1 MB', time: 'Yesterday' }
                  ].map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold">PPT</span>
                        <div>
                          <div className="text-xs font-semibold dark:text-white">{file.name}</div>
                          <div className="text-[10px] text-slate-500">{file.size} • {file.time}</div>
                        </div>
                      </div>
                      <span className="p-1 rounded-full bg-white/20 text-slate-600 dark:text-slate-300"><Download className="w-3.5 h-3.5" /></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-[28px] border border-white/40 flex flex-col items-start text-left">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-5 border border-indigo-500/10">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-xl mb-3 dark:text-white">Zero Pendrive Failures</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              No more forgetting USB drives or dealing with broken adapters. Simply upload presentations from home, and access them with one-click in class.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-[28px] border border-white/40 flex flex-col items-start text-left">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl mb-5 border border-purple-500/10">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-xl mb-3 dark:text-white">QR Code Download</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Display a secure QR code on any device. Scan it on your mobile phone or laptop to grab files instantly without logging in manually everywhere.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-[28px] border border-white/40 flex flex-col items-start text-left">
            <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl mb-5 border border-teal-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-xl mb-3 dark:text-white">Isolated Security Vaults</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Each student and professional gets their own cryptographically isolated sandbox. Files NEVER mix. Unauthorized logins are completely restricted.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 relative z-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span>© 2026 pumanocan Cloud Vault. Store Once. Access Everywhere.</span>
        <div className="flex gap-6">
          <span className="hover:text-indigo-500 transition-colors cursor-pointer">Security Standards</span>
          <span className="hover:text-indigo-500 transition-colors cursor-pointer">Terms of Service</span>
          <span className="hover:text-indigo-500 transition-colors cursor-pointer">Privacy Vault</span>
        </div>
      </footer>
    </div>
  );
}
