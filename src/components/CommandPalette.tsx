import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, FileText, FolderPlus, Settings, Sparkles, Star, Trash2, 
  Moon, Sun, HelpCircle, ArrowRight, Play, Upload, MessageSquare 
} from 'lucide-react';
import { FileItem, Folder } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  folders: Folder[];
  onSelectFile: (file: FileItem) => void;
  onOpenNewFolder: () => void;
  onOpenSettings: () => void;
  onUploadTrigger: () => void;
  onSwitchTab: (tab: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

export default function CommandPalette({
  isOpen,
  onClose,
  files,
  folders,
  onSelectFile,
  onOpenNewFolder,
  onOpenSettings,
  onUploadTrigger,
  onSwitchTab,
  onToggleTheme,
  isDarkMode
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Static commands
  const systemCommands = [
    { id: 'upload', title: 'Upload Presentation File', category: 'Actions', icon: Upload, action: () => { onUploadTrigger(); onClose(); } },
    { id: 'new-folder', title: 'Create New Folder...', category: 'Actions', icon: FolderPlus, action: () => { onOpenNewFolder(); onClose(); } },
    { id: 'yoyo-present', title: 'Launch Yoyo Present Mode', category: 'Navigation', icon: Play, action: () => { onSwitchTab('yoyo-present'); onClose(); } },
    { id: 'ask-ai', title: 'Ask Yoyo AI Assistant', category: 'AI Tools', icon: Sparkles, action: () => { onSwitchTab('dashboard'); onClose(); } },
    { id: 'goto-fav', title: 'View Favorite Vault', category: 'Navigation', icon: Star, action: () => { onSwitchTab('favorites'); onClose(); } },
    { id: 'goto-settings', title: 'Open Settings Canvas', category: 'Settings', icon: Settings, action: () => { onOpenSettings(); onClose(); } },
    { id: 'toggle-dark', title: `Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`, category: 'Settings', icon: isDarkMode ? Sun : Moon, action: () => { onToggleTheme(); onClose(); } },
  ];

  // Filter lists
  const filteredFiles = files
    .filter(f => !f.is_deleted && f.filename.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  const filteredFolders = folders
    .filter(f => f.folder_name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  const filteredCommands = systemCommands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  // Combine items for flat navigation
  const combinedItems: Array<
    | { type: 'command'; id: string; title: string; category: string; icon: any; action: () => void }
    | { type: 'file'; item: FileItem; title: string; category: string }
    | { type: 'folder'; item: Folder; title: string; category: string }
  > = [
    ...filteredCommands.map(c => ({ type: 'command' as const, ...c })),
    ...filteredFiles.map(f => ({ type: 'file' as const, item: f, title: f.filename, category: 'Presentations & Files' })),
    ...filteredFolders.map(fold => ({ type: 'folder' as const, item: fold, title: fold.folder_name, category: 'Folders' }))
  ];

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % combinedItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + combinedItems.length) % combinedItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (combinedItems[selectedIndex]) {
          triggerItem(combinedItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, combinedItems]);

  const triggerItem = (item: typeof combinedItems[number]) => {
    if (item.type === 'command') {
      item.action();
    } else if (item.type === 'file') {
      onSelectFile(item.item);
      onClose();
    } else if (item.type === 'folder') {
      // Switch tab and set active folder ID could be done
      onSwitchTab('files');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-start justify-center pt-[15vh] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -10 }}
          ref={containerRef}
          className="w-full max-w-2xl bg-slate-950/75 dark:bg-slate-950/80 border border-white/20 rounded-[28px] overflow-hidden shadow-2xl relative text-white select-none"
        >
          {/* Ambient blur backdrops for glass effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute w-72 h-72 rounded-full bg-indigo-500/10 blur-[60px] top-0 left-10 animate-pulse" />
            <div className="absolute w-64 h-64 rounded-full bg-purple-500/10 blur-[50px] bottom-0 right-10" />
          </div>

          {/* Search Input Bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search files, folders or type commands... (e.g. settings)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 outline-none"
            />
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-md font-mono text-slate-400 shrink-0">ESC</span>
          </div>

          {/* Items List */}
          <div className="max-h-[360px] overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {combinedItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-1">
                <HelpCircle className="w-8 h-8 mx-auto opacity-40 text-indigo-400" />
                <p className="text-xs font-semibold">No results found for "{query}"</p>
                <p className="text-[10px]">Try searching for other presentations or actions.</p>
              </div>
            ) : (
              // Group items by category for high visual polish
              combinedItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const showCategoryHeader = idx === 0 || combinedItems[idx - 1].category !== item.category;

                return (
                  <React.Fragment key={`${item.category}-${item.title}-${idx}`}>
                    {showCategoryHeader && (
                      <div className="px-3.5 pt-3 pb-1.5 text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest">
                        {item.category}
                      </div>
                    )}
                    <button
                      onClick={() => triggerItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left transition-all duration-150 ${
                        isSelected 
                          ? 'bg-white/10 border-l-4 border-indigo-500 text-white shadow-md' 
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.type === 'command' && (
                          <item.icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                        )}
                        {item.type === 'file' && (
                          <FileText className={`w-4 h-4 ${isSelected ? 'text-orange-400' : 'text-slate-400'}`} />
                        )}
                        {item.type === 'folder' && (
                          <FolderPlus className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                        )}
                        <span className="text-xs font-semibold">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            Run <ArrowRight className="w-3 h-3 text-indigo-400" />
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500 font-mono">
                          {item.type === 'command' ? 'Command' : item.type === 'file' ? 'File' : 'Folder'}
                        </span>
                      </div>
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Palette Footer */}
          <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <div className="flex gap-4">
              <span>↑↓ Navigation</span>
              <span>↵ Select</span>
            </div>
            <span>Press Ctrl + K to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
