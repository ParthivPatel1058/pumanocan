import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Link, Star, Pin, Trash2, FolderSync, QrCode, Check, RefreshCw, FileText, FileVideo, FileCode, Presentation, AlertCircle 
} from 'lucide-react';
import { FileItem, Folder } from '../types';

interface FileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  folders: Folder[];
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onMoveFile: (id: string, folderId: string | null) => void;
  onDeleteFile: (id: string) => void;
  onDownload: (file: FileItem) => void;
}

export default function FileDetailsModal({
  isOpen,
  onClose,
  file,
  folders,
  onTogglePin,
  onToggleFavorite,
  onMoveFile,
  onDeleteFile,
  onDownload
}: FileDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [targetFolder, setTargetFolder] = useState<string>('');

  if (!file) return null;

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get Lucide Icon for specific MIME types
  const getFileIcon = (mime: string) => {
    if (mime.includes('presentation') || mime.includes('powerpoint') || mime.includes('pptx')) {
      return { icon: Presentation, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/15' };
    }
    if (mime.includes('pdf')) {
      return { icon: FileText, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/15' };
    }
    if (mime.includes('word') || mime.includes('document')) {
      return { icon: FileText, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/15' };
    }
    if (mime.includes('video') || mime.includes('mp4')) {
      return { icon: FileVideo, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15' };
    }
    return { icon: FileCode, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/15' };
  };

  const fileStyle = getFileIcon(file.mime_type);
  const FileIconComponent = fileStyle.icon;

  // Derive static standalone download URL using public domain
  const publicDownloadLink = `${window.location.origin}/vault-item/${file.id}?dl=true`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicDownloadLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMoveFile(file.id, targetFolder === 'root' ? null : targetFolder);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicDownloadLink)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="w-full max-w-lg liquid-glass rounded-[40px] overflow-hidden p-6 md:p-8 border border-white/35 shadow-2xl relative text-white"
          >
            {/* Animated liquid light blobs inside the card to simulate fluid refraction */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 rounded-[38px]">
              <div className="absolute w-48 h-48 rounded-full bg-[#1e40af]/30 blur-[40px] -top-10 -left-10 animate-fluid-1" />
              <div className="absolute w-56 h-56 rounded-full bg-[#701a75]/25 blur-[45px] -bottom-12 -right-8 animate-fluid-2" />
            </div>

            {/* Apple macOS style window controls (Traffic light buttons) */}
            <div className="absolute left-6 top-6 md:left-8 md:top-8 flex items-center gap-1.5 z-10">
              <button 
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 active:scale-95 transition-all relative flex items-center justify-center group cursor-pointer shadow-[0_0_6px_rgba(255,95,86,0.4)]"
                title="Close"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-[#4c0002] font-black leading-none select-none transition-opacity">×</span>
              </button>
              <div 
                className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 transition-all cursor-pointer shadow-[0_0_6px_rgba(255,189,46,0.3)]"
                title="Minimize"
              />
              <div 
                className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 transition-all cursor-pointer shadow-[0_0_6px_rgba(39,201,63,0.3)]"
                title="Maximize"
              />
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mt-8 md:mt-10">
              
              {/* Left Content Side */}
              <div className="md:col-span-7 space-y-5 text-left">
                
                {/* Header Profile Info */}
                <div className="flex gap-4 items-center">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner ${fileStyle.color}`}>
                    <FileIconComponent className="w-7 h-7" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-base font-bold text-[#ebd2b4] truncate" title={file.filename}>
                      {file.filename}
                    </h3>
                    <p className="text-[11px] text-white/70 font-mono">
                      {formatBytes(file.file_size)} • {file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                </div>

                {/* Technical Stats Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/15 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60 font-medium">Uploaded At:</span>
                    <span className="text-white font-semibold">{new Date(file.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-medium">Total Downloads:</span>
                    <span className="text-white font-semibold">{file.download_count} scans / hits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-medium">Security State:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">🛡️ AES-256 Encrypted</span>
                  </div>
                </div>

                {/* Primary Interactive File Controls */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onTogglePin(file.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      file.is_pinned 
                        ? 'bg-amber-500/30 border-amber-400/50 text-amber-200' 
                        : 'bg-white/10 border-white/15 text-white/90 hover:bg-white/20'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${file.is_pinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                    {file.is_pinned ? 'Pinned' : 'Pin File'}
                  </button>

                  <button
                    onClick={() => onToggleFavorite(file.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      file.is_favorite 
                        ? 'bg-[#0a3a78]/40 border-white/30 text-[#ebd2b4] shadow-md' 
                        : 'bg-white/10 border-white/15 text-white/90 hover:bg-white/20'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${file.is_favorite ? 'fill-[#ebd2b4] text-[#ebd2b4]' : ''}`} />
                    {file.is_favorite ? 'Favorited' : 'Favorite'}
                  </button>

                  <button
                    onClick={() => {
                      onDeleteFile(file.id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>

                {/* Move folder Form */}
                <form onSubmit={handleMoveSubmit} className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#ebd2b4] uppercase tracking-wider">
                    Re-Organize File Location
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={targetFolder}
                      onChange={(e) => setTargetFolder(e.target.value)}
                      className="flex-1 bg-white/10 hover:bg-white/15 focus:bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-slate-900 text-white">Select target folder...</option>
                      <option value="root" className="bg-slate-900 text-white">Root Vault Directory</option>
                      {folders.map(fold => (
                        <option key={fold.id} value={fold.id} className="bg-slate-900 text-white">
                          {fold.folder_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!targetFolder}
                      className="px-4 py-2 bg-[#0a3a78] hover:bg-[#0a3a78]/80 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/10"
                    >
                      <FolderSync className="w-3.5 h-3.5" />
                      Move
                    </button>
                  </div>
                </form>

              </div>

              {/* Right Media Side (Download, Link and QR Code) */}
              <div className="md:col-span-5 flex flex-col items-center gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-5 md:pt-0 md:pl-5">
                
                {/* QR Code toggler */}
                <div className="w-full">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="w-full py-2.5 px-4 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <QrCode className="w-4 h-4 text-[#ebd2b4]" />
                    {showQR ? "Hide Smart QR" : "Show TV / Smartboard QR"}
                  </button>
                </div>

                {/* Conditional Display QR vs Thumbnail Preview */}
                <AnimatePresence mode="wait">
                  {showQR ? (
                    <motion.div 
                      key="qr-code"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-4 rounded-2xl bg-white border border-white/10 shadow-lg text-center relative flex flex-col items-center"
                    >
                      <img 
                        src={qrCodeUrl} 
                        alt="Download QR" 
                        referrerPolicy="no-referrer"
                        className="w-32 h-32 border border-slate-100 p-1 bg-white rounded"
                      />
                      <span className="text-[10px] font-bold text-slate-700 mt-2 block">
                        Scan with Phone to Grab File
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="thumbnail"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full aspect-square max-w-[160px] rounded-2xl bg-white/5 border border-white/20 shadow-inner flex flex-col items-center justify-center text-center p-3 relative"
                    >
                      <Presentation className="w-12 h-12 text-[#ebd2b4] mb-2 opacity-80 animate-pulse" />
                      <span className="text-[10px] font-bold text-[#ebd2b4] uppercase tracking-widest leading-none">
                        File Vault
                      </span>
                      <span className="text-[9px] text-white/75 mt-1 truncate max-w-[130px]">
                        {file.filename.split('.').pop()?.toUpperCase() || 'FILE'} Preview Available
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary Download buttons */}
                <div className="w-full space-y-2 mt-2">
                  <button
                    onClick={() => onDownload(file)}
                    className="w-full py-3.5 rounded-full bg-[#0a3a78] hover:bg-[#0a3a78]/80 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Presentation
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Link className="w-3.5 h-3.5" />
                        Copy Smart Link
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
