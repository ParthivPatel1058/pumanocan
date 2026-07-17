import React from 'react';
import { FolderPlus, UploadCloud, Share2, FileText } from 'lucide-react';

interface QuickActionsProps {
  onNewFolder: () => void;
  onUploadClick: () => void;
  onShareClick: () => void;
  onAddNote: () => void;
}

export default function QuickActions({ 
  onNewFolder, 
  onUploadClick, 
  onShareClick, 
  onAddNote 
}: QuickActionsProps) {
  
  // Bento bento action definitions
  const items = [
    {
      id: 'new-folder',
      label: 'New Folder',
      icon: FolderPlus,
      bg: 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-500/15',
      action: onNewFolder
    },
    {
      id: 'upload-files',
      label: 'Upload Files',
      icon: UploadCloud,
      bg: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/15',
      action: onUploadClick
    },
    {
      id: 'share-folder',
      label: 'Share Folder',
      icon: Share2,
      bg: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-300 border-pink-500/15',
      action: onShareClick
    },
    {
      id: 'add-note',
      label: 'Add Note',
      icon: FileText,
      bg: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/15',
      action: onAddNote
    }
  ];

  return (
    <div className="glass-panel rounded-[28px] border border-white/45 p-5 shadow-lg flex flex-col justify-between select-none">
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 text-left">
        ⚡ Quick Actions
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`quick-action-${item.id}`}
              onClick={item.action}
              className={`p-4 rounded-[20px] border flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 active:scale-95 group cursor-pointer ${item.bg}`}
            >
              <div className="p-2 rounded-xl bg-white/25 dark:bg-slate-900/10 shadow-sm border border-white/20 transition-transform group-hover:scale-110">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
