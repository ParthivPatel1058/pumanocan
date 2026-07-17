import React, { useState } from 'react';
import { 
  Cloud, LayoutDashboard, FolderClosed, Clock, Share2, Star, Trash2, Settings, LogOut, Sparkles, ChevronUp, ChevronDown, Presentation 
} from 'lucide-react';
import { Profile, FileItem } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: Profile;
  files: FileItem[];
  onLogout: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  files, 
  onLogout, 
  onOpenSettings 
}: SidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  // Dynamic storage calculation (Total 10 GB limit = 10,737,418,240 bytes)
  const totalLimitBytes = 10 * 1024 * 1024 * 1024;
  const usedBytes = files
    .filter(f => !f.is_deleted)
    .reduce((sum, f) => sum + f.file_size, 0);
  
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(1);
  const usedPercent = Math.min(100, Math.round((usedBytes / totalLimitBytes) * 100));

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'My Presentations', icon: FolderClosed },
    { id: 'google-slides', label: 'Google Slides', icon: Presentation },
    { id: 'yoyo-present', label: 'Yoyo Present Mode', icon: Sparkles },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'shared', label: 'Shared with me', icon: Share2 },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <div className="w-full md:w-64 flex flex-col shrink-0 gap-6 h-full select-none">
      {/* Brand Title block */}
      <div className="glass-panel rounded-[24px] p-5 border border-white/45 flex items-center gap-3.5 shadow-md">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/80 via-purple-500/60 to-pink-500/50 flex items-center justify-center shadow border border-white/25">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">YOYOCLESTA</h2>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-sans">Premium Presentation Vault</span>
        </div>
      </div>

      {/* Main Glass Navigation Panel */}
      <div className="glass-panel rounded-[28px] border border-white/45 p-4 flex-1 flex flex-col justify-between shadow-lg">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-[16px] text-xs font-semibold tracking-wide transition-all duration-300 relative ${
                  isActive 
                    ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 border border-indigo-500/10' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/15'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
                {item.label}
                {isActive && (
                  <span className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Dynamic Storage Indicator */}
        <div className="mt-6 pt-5 border-t border-white/10 px-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5" /> Storage</span>
            <span>{usedGB} GB / 10 GB</span>
          </div>
          <div className="w-full bg-slate-200/50 dark:bg-slate-900/30 h-1.5 rounded-full overflow-hidden border border-white/10">
            <div 
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${usedPercent || 32}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upgrade + Profile Bottom Blocks */}
      <div className="space-y-4">
        {/* Upgrade Plan Card */}
        <button
          id="upgrade-plan-btn"
          className="w-full py-3 px-5 rounded-[20px] bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Upgrade Plan
        </button>

        {/* Profile and Settings Panel */}
        <div className="relative">
          {/* Settings and Log out Dropdown */}
          {profileOpen && (
            <div className="absolute bottom-16 left-0 right-0 glass-panel rounded-[20px] border border-white/45 p-2 shadow-xl z-30 space-y-1">
              <button
                onClick={() => {
                  onOpenSettings();
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/15 text-left"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                Settings
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Logout Vault
              </button>
            </div>
          )}

          {/* Master Profile Card */}
          <div 
            onClick={() => setProfileOpen(!profileOpen)}
            className="glass-panel rounded-[24px] p-3 border border-white/45 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all shadow shadow-indigo-500/5 select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-400 flex items-center justify-center border border-white text-white text-xs font-bold shadow-sm overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.display_name}`} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                  {user.display_name}
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono overflow-hidden text-ellipsis max-w-[100px]">
                  {user.vault_name}'s vault
                </div>
              </div>
            </div>
            {profileOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </div>
      </div>
    </div>
  );
}
