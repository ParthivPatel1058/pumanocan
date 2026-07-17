import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, Moon, Sun, Sliders, Palette, Globe, ShieldCheck, Fingerprint, Lock, KeyRound, Check, RefreshCw 
} from 'lucide-react';
import { AppSettings, Profile } from '../types';

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  user: Profile;
  onUpdatePasscode: (newPasscode: string) => Promise<void>;
}

export default function SettingsPage({ 
  settings, 
  onSaveSettings, 
  user, 
  onUpdatePasscode 
}: SettingsPageProps) {
  
  const [darkMode, setDarkMode] = useState(settings.darkMode);
  const [glassIntensity, setGlassIntensity] = useState(settings.glassIntensity);
  const [backgroundImage, setBackgroundImage] = useState(settings.backgroundImage);
  const [language, setLanguage] = useState(settings.language);

  // Security sub-states
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState(false);
  const [loadingPasscode, setLoadingPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');

  const [biometricsEnabled, setBiometricsEnabled] = useState(user.biometrics_enabled ?? true);

  const backgrounds = [
    { name: 'Clouds ☁️', value: 'clouds', url: 'https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?auto=format&fit=crop&w=300&q=80' },
    { name: 'Aurora 🌌', value: 'aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=300&q=80' },
    { name: 'Frost 🏔', value: 'frost', url: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&w=300&q=80' },
    { name: 'Ocean 🌊', value: 'ocean', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80' },
    { name: 'Sakura 🌸', value: 'sakura', url: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?auto=format&fit=crop&w=300&q=80' },
    { name: 'Sunset 🌅', value: 'sunset', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80' },
    { name: 'Midnight 🌃', value: 'midnight', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=300&q=80' },
    { name: 'Forest 🌿', value: 'forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80' },
    { name: 'Galaxy 🌠', value: 'galaxy', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=300&q=80' }
  ];

  const handleApplyVisuals = () => {
    onSaveSettings({
      darkMode,
      glassIntensity,
      backgroundImage,
      language
    });
  };

  const handlePasscodeChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    setPasscodeSuccess(false);
    setLoadingPasscode(true);

    if (newPasscode.length < 4 || newPasscode.length > 6 || isNaN(Number(newPasscode))) {
      setPasscodeError('PIN must be 4 to 6 numeric digits.');
      setLoadingPasscode(false);
      return;
    }

    try {
      await onUpdatePasscode(newPasscode);
      setPasscodeSuccess(true);
      setNewPasscode('');
    } catch (err: any) {
      setPasscodeError(err.message || 'Failed to update credentials.');
    } finally {
      setLoadingPasscode(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none text-left">
      
      {/* Visual Canvas Preset Customizer */}
      <div className="glass-panel rounded-[32px] p-6 md:p-8 border border-white/45 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <Palette className="w-5 h-5 text-indigo-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Canvas & Glass Customization</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Theme Mode and Glass Opacity Slider */}
          <div className="space-y-6">
            
            {/* Dark mode switcher */}
            <div>
              <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                Display Theme Mode
              </span>
              <div className="flex p-1 rounded-full bg-slate-200/50 dark:bg-slate-950/25 border border-white/10 max-w-[240px] shadow-inner">
                <button
                  type="button"
                  onClick={() => setDarkMode(false)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !darkMode ? 'bg-white text-indigo-950 shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => setDarkMode(true)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    darkMode ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark Mode
                </button>
              </div>
            </div>

            {/* Glass Intensity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Glass backdrop opacity</span>
                <span>{glassIntensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={glassIntensity}
                onChange={(e) => setGlassIntensity(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Adjust the frosted blur thickness of interactive frames.</span>
            </div>

            {/* Language Selector */}
            <div>
              <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                System Language
              </span>
              <select
                value={language}
                onChange={(e: any) => setLanguage(e.target.value)}
                className="w-full max-w-[240px] bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none"
              >
                <option value="en" className="text-slate-800">English (Global)</option>
                <option value="es" className="text-slate-800">Español</option>
                <option value="fr" className="text-slate-800">Français</option>
                <option value="de" className="text-slate-800">Deutsch</option>
              </select>
            </div>

          </div>

          {/* Background selection preset grids */}
          <div className="space-y-4">
            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Atmospheric Background Wallpaper
            </span>
            <div className="grid grid-cols-2 gap-3.5">
              {backgrounds.map((bg) => (
                <button
                  key={bg.name}
                  type="button"
                  onClick={() => setBackgroundImage(bg.value)}
                  className={`relative aspect-[16/10] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    backgroundImage === bg.value ? 'border-indigo-500 scale-102 shadow-lg' : 'border-white/20 hover:border-white/50'
                  }`}
                >
                  <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/40 p-2 text-center">
                    <span className="text-[10px] font-bold text-white truncate block">{bg.name}</span>
                  </div>
                  {backgroundImage === bg.value && (
                    <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-0.5 text-white shadow">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Action Bar */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            id="apply-settings-btn"
            onClick={handleApplyVisuals}
            className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Apply Visual Presets
          </button>
        </div>
      </div>

      {/* Cryptographic Keypad & PIN Security Settings */}
      <div className="glass-panel rounded-[32px] p-6 md:p-8 border border-white/45 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <ShieldCheck className="w-5 h-5 text-purple-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Security Cryptography Vault</h3>
        </div>

        <div className="max-w-md">
          {/* passcode changing form */}
          <form onSubmit={handlePasscodeChangeSubmit} className="space-y-4">
            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Renew Vault Security PIN
            </span>
            
            {passcodeSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Vault Passcode PIN successfully rotated.</span>
              </div>
            )}

            {passcodeError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs">
                {passcodeError}
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="Enter 4 to 6 digit new PIN"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white tracking-widest text-center font-mono font-bold"
                />
                <KeyRound className="absolute left-4 top-2.5 w-4 h-4 text-slate-400" />
              </div>
              <button
                type="submit"
                disabled={loadingPasscode}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              >
                {loadingPasscode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Rotate Security PIN"}
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}
