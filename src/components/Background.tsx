import React from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';

interface BackgroundProps {
  settings: AppSettings;
}

export default function Background({ settings }: BackgroundProps) {
  const { darkMode, backgroundImage } = settings;

  // Set style values dynamically based on the chosen premium theme name
  // Themes: Clouds, Aurora, Frost, Ocean, Sakura, Sunset, Midnight, Forest, Galaxy
  const theme = backgroundImage.toLowerCase();

  let baseGradient = '';
  let orb1Color = ''; // Top left
  let orb2Color = ''; // Bottom right
  let orb3Color = ''; // Middle right

  if (theme.includes('clouds')) {
    baseGradient = darkMode 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' 
      : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)';
    orb1Color = 'bg-sky-400/30 dark:bg-sky-500/20';
    orb2Color = 'bg-slate-300/40 dark:bg-slate-700/20';
    orb3Color = 'bg-white/50 dark:bg-slate-500/15';
  } else if (theme.includes('frost')) {
    baseGradient = darkMode
      ? 'linear-gradient(135deg, #040811 0%, #0b1528 50%, #13223f 100%)'
      : 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #eff6ff 100%)';
    orb1Color = 'bg-teal-200/30 dark:bg-teal-500/15';
    orb2Color = 'bg-blue-300/30 dark:bg-blue-800/20';
    orb3Color = 'bg-cyan-100/45 dark:bg-cyan-600/10';
  } else if (theme.includes('ocean')) {
    baseGradient = darkMode
      ? 'linear-gradient(135deg, #010f24 0%, #02204c 50%, #03346e 100%)'
      : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #93c5fd 100%)';
    orb1Color = 'bg-cyan-500/25 dark:bg-cyan-500/20';
    orb2Color = 'bg-blue-600/20 dark:bg-blue-900/30';
    orb3Color = 'bg-emerald-400/15 dark:bg-emerald-700/10';
  } else if (theme.includes('sakura')) {
    baseGradient = darkMode
      ? 'linear-gradient(135deg, #1c0a15 0%, #2d0b23 50%, #0f020a 100%)'
      : 'linear-gradient(135deg, #fff5f7 0%, #fce7f3 50%, #fbcfe8 100%)';
    orb1Color = 'bg-pink-300/40 dark:bg-pink-500/20';
    orb2Color = 'bg-rose-400/20 dark:bg-rose-900/20';
    orb3Color = 'bg-amber-200/30 dark:bg-fuchsia-950/20';
  } else if (theme.includes('sunset')) {
    baseGradient = darkMode
      ? 'linear-gradient(135deg, #20040e 0%, #3b071e 50%, #150209 100%)'
      : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde047 100%)';
    orb1Color = 'bg-orange-400/35 dark:bg-orange-500/15';
    orb2Color = 'bg-red-300/25 dark:bg-rose-800/25';
    orb3Color = 'bg-amber-200/45 dark:bg-yellow-600/15';
  } else if (theme.includes('midnight')) {
    baseGradient = darkMode
      ? 'linear-gradient(135deg, #020408 0%, #080f1e 50%, #010204 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #cbd5e1 100%)';
    orb1Color = 'bg-slate-400/20 dark:bg-slate-800/30';
    orb2Color = 'bg-indigo-300/15 dark:bg-indigo-950/35';
    orb3Color = 'bg-blue-200/20 dark:bg-slate-900/40';
  } else if (theme.includes('forest')) {
    baseGradient = darkMode
      ? 'linear-gradient(135deg, #01140e 0%, #03281c 50%, #010806 100%)'
      : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)';
    orb1Color = 'bg-emerald-300/35 dark:bg-emerald-500/15';
    orb2Color = 'bg-green-400/25 dark:bg-green-800/20';
    orb3Color = 'bg-teal-200/30 dark:bg-emerald-950/20';
  } else if (theme.includes('galaxy')) {
    baseGradient = darkMode
      ? 'linear-gradient(135deg, #06030e 0%, #130728 50%, #020106 100%)'
      : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)';
    orb1Color = 'bg-fuchsia-500/25 dark:bg-fuchsia-500/20';
    orb2Color = 'bg-violet-600/20 dark:bg-purple-900/30';
    orb3Color = 'bg-indigo-400/20 dark:bg-cyan-800/15';
  } else {
    // Default theme (Aurora)
    baseGradient = darkMode 
      ? 'linear-gradient(135deg, #090d16 0%, #111424 50%, #05070f 100%)' 
      : 'linear-gradient(135deg, #fce7f3 0%, #e0f2fe 50%, #f5f3ff 100%)';
    orb1Color = 'bg-teal-200/40 dark:bg-teal-500/20';
    orb2Color = 'bg-violet-200/40 dark:bg-violet-800/20';
    orb3Color = 'bg-pink-200/35 dark:bg-pink-800/15';
  }

  return (
    <div className="fixed inset-0 overflow-hidden -z-20 select-none transition-colors duration-1000">
      {/* Base Gradient Wallpaper */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: baseGradient }}
      />

      {/* Atmospheric Aurora Blobs - Exactly matching premium VisionOS glassmorphism specification */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-80 md:opacity-100">
        {/* Blob 1: Top-left */}
        <div 
          className={`absolute w-[450px] h-[450px] rounded-full blur-[90px] -top-24 -left-24 animate-float-1 transition-all duration-1000 ${orb1Color}`}
          style={{ mixBlendMode: darkMode ? 'screen' : 'multiply' }}
        />
        {/* Blob 2: Bottom-right */}
        <div 
          className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] -bottom-36 -right-24 animate-float-2 transition-all duration-1000 ${orb2Color}`}
          style={{ mixBlendMode: darkMode ? 'screen' : 'multiply' }}
        />
        {/* Blob 3: Middle-right */}
        <div 
          className={`absolute w-[320px] h-[320px] rounded-full blur-[80px] top-1/4 right-[10%] animate-float-3 transition-all duration-1000 ${orb3Color}`}
          style={{ mixBlendMode: darkMode ? 'screen' : 'multiply' }}
        />
      </div>

      {/* Extreme Fine Grain / Noise Overlay for tactile Apple glass texture */}
      <div 
        className="absolute inset-0 opacity-[0.012] pointer-events-none bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
