import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderPlus, X, HelpCircle } from 'lucide-react';
import { Folder } from '../types';

interface AddFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, parentId?: string) => void;
  existingFolders: Folder[];
}

export default function AddFolderModal({ 
  isOpen, 
  onClose, 
  onCreate, 
  existingFolders 
}: AddFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    
    onCreate(folderName.trim(), parentId || undefined);
    setFolderName('');
    setParentId('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-sm liquid-glass rounded-[40px] overflow-hidden p-6 md:p-8 border border-white/35 shadow-2xl relative text-white"
          >
            {/* Animated liquid light blobs inside the card to simulate fluid refraction */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 rounded-[38px]">
              <div className="absolute w-48 h-48 rounded-full bg-[#1e40af]/30 blur-[40px] -top-10 -left-10 animate-fluid-1" />
              <div className="absolute w-56 h-56 rounded-full bg-[#701a75]/25 blur-[45px] -bottom-12 -right-8 animate-fluid-2" />
            </div>

            {/* Apple macOS style window controls (Traffic light buttons) */}
            <div className="absolute left-6 top-6 flex items-center gap-1.5 z-10">
              <button 
                type="button"
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 active:scale-95 transition-all relative flex items-center justify-center group cursor-pointer shadow-[0_0_5px_rgba(255,95,86,0.5)]"
                title="Close"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-[#4c0002] font-black leading-none select-none transition-opacity">×</span>
              </button>
              <div 
                className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 transition-all cursor-pointer shadow-[0_0_5px_rgba(255,189,46,0.4)]"
                title="Minimize"
              />
              <div 
                className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 transition-all cursor-pointer shadow-[0_0_5px_rgba(39,201,63,0.4)]"
                title="Maximize"
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4 mt-8">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-[#ebd2b4]">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#ebd2b4]">Create Private Folder</h3>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-[#ebd2b4] uppercase tracking-wider mb-1.5">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Science Project Slides"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/15 border border-white/20 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/40 outline-none transition-all focus:border-white/40 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#ebd2b4] uppercase tracking-wider mb-1.5">
                  Parent Folder (For Nested Structure)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/15 border border-white/20 rounded-2xl px-4 py-3 text-xs text-white outline-none transition-all focus:border-white/40 font-medium cursor-pointer"
                >
                  <option value="" className="text-white bg-slate-900">Root (No Parent Folder)</option>
                  {existingFolders.map((folder) => (
                    <option key={folder.id} value={folder.id} className="text-white bg-slate-900">
                      {folder.folder_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="create-folder-submit-btn"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0a3a78] hover:bg-[#0a3a78]/80 text-white text-xs font-semibold shadow border border-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
