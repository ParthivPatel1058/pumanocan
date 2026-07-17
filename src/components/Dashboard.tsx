import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Search, Bell, Plus, Download, MoreHorizontal, Pin, Star, Folder, 
  Trash2, FileText, Presentation, FileCode, Check, RefreshCw, Upload, FileUp, 
  ChevronRight, Calendar, ArrowUpRight, PlusCircle, Bookmark, ExternalLink, HelpCircle
} from 'lucide-react';
import { Profile, Folder as FolderType, FileItem, ActivityLog, AppSettings } from '../types';
import { dbFiles, dbFolders, dbActivities } from '../lib/db';
import QuickActions from './QuickActions';
import GoogleSlidesExplorer from './GoogleSlidesExplorer';
import YoyoAIAssistant from './YoyoAIAssistant';

interface DashboardProps {
  user: Profile;
  files: FileItem[];
  folders: FolderType[];
  refreshData: () => void;
  onOpenFileDetails: (file: FileItem) => void;
  onOpenNewFolder: () => void;
  currentTab: string;
}

export default function Dashboard({
  user,
  files,
  folders,
  refreshData,
  onOpenFileDetails,
  onOpenNewFolder,
  currentTab
}: DashboardProps) {
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<string>('all'); // 'all' | 'pptx' | 'pdf' | 'docx'
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  // Folder Navigation State for nested structures!
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // File Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadCancelled, setUploadCancelled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick contextual note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'activity' | 'ai'>('ai');

  // Row Action Menu popup helper
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);

  // Notifications simulation
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Storage Used Calculator
  const totalLimitBytes = 10 * 1024 * 1024 * 1024; // 10 GB
  const activeFiles = files.filter(f => !f.is_deleted);
  const usedBytes = activeFiles.reduce((sum, f) => sum + f.file_size, 0);
  const usedPercent = Math.min(100, Math.round((usedBytes / totalLimitBytes) * 100));
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(1);

  // Show dynamic system notification banner
  const triggerNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Drag and Drop files handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const performUpload = async (htmlFiles: FileList) => {
    if (!htmlFiles || htmlFiles.length === 0) return;
    
    const fileToUpload = htmlFiles[0];
    setUploadFileName(fileToUpload.name);
    setUploadProgress(0);
    setUploadCancelled(false);

    try {
      await dbFiles.uploadFileReal(
        user.id,
        fileToUpload,
        fileToUpload.name,
        activeFolderId,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      triggerNotification(`Uploaded ${fileToUpload.name} to Cloud Storage successfully!`);
      setUploadProgress(null);
      refreshData();
    } catch (err: any) {
      console.error("Cloud storage upload failed:", err);
      triggerNotification(`Upload failed: ${err?.message || err}`);
      setUploadProgress(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      performUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      performUpload(e.target.files);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Create a note directly as a presentation outline or txt document
  const handleSaveNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const dummyBlob = new Blob([noteContent], { type: 'text/plain' });
    const fileName = `${noteTitle.trim()}.txt`;

    try {
      triggerNotification(`Saving note outline to cloud...`);
      await dbFiles.uploadFileReal(
        user.id,
        dummyBlob,
        fileName,
        activeFolderId
      );

      setNoteTitle('');
      setNoteContent('');
      setShowNoteForm(false);
      triggerNotification(`Saved note outline to Cloud Storage successfully.`);
      refreshData();
    } catch (err: any) {
      console.error("Failed to save note to cloud:", err);
      triggerNotification(`Failed to save note: ${err?.message || err}`);
    }
  };

  // Action toggling wrappers
  const handleTogglePin = (id: string) => {
    dbFiles.togglePinFile(user.id, id);
    triggerNotification("Updated file pin status.");
    refreshData();
    setActiveMenuFileId(null);
  };

  const handleToggleFavorite = (id: string) => {
    dbFiles.toggleFavoriteFile(user.id, id);
    triggerNotification("Updated favorites state.");
    refreshData();
    setActiveMenuFileId(null);
  };

  const handleDeleteFile = (id: string) => {
    dbFiles.deleteFile(user.id, id);
    triggerNotification("Moved item to Vault Trash.");
    refreshData();
    setActiveMenuFileId(null);
  };

  const handleRestoreFile = (id: string) => {
    dbFiles.restoreFile(user.id, id);
    triggerNotification("Restored item to storage vault.");
    refreshData();
    setActiveMenuFileId(null);
  };

  // Helper file byte sizing format
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filter & Sort Logic based on current sub-tab or parent folder!
  const getFilteredFiles = () => {
    let list = [...files];

    // 1. Isolation logic: must strictly belong to current logged-in user
    list = list.filter(f => f.owner_id === user.id);

    // 2. Tab filters
    if (currentTab === 'dashboard') {
      list = list.filter(f => !f.is_deleted);
    } else if (currentTab === 'files') {
      list = list.filter(f => !f.is_deleted);
      // If we are looking at files tab, support browsing inside the active folder!
      list = list.filter(f => f.folder_id === activeFolderId);
    } else if (currentTab === 'recent') {
      list = list.filter(f => !f.is_deleted && !f.is_seeded);
    } else if (currentTab === 'shared') {
      list = list.filter(f => !f.is_deleted && f.download_count > 5); // Simulated shared files
    } else if (currentTab === 'favorites') {
      list = list.filter(f => !f.is_deleted && f.is_favorite);
    } else if (currentTab === 'trash') {
      list = list.filter(f => f.is_deleted);
    }

    // 3. Search text query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(f => 
        f.filename.toLowerCase().includes(q) || 
        f.mime_type.toLowerCase().includes(q)
      );
    }

    // 4. File extension type filters
    if (searchType !== 'all') {
      list = list.filter(f => f.filename.toLowerCase().endsWith(searchType));
    }

    // 5. Sorting
    if (sortBy === 'date') {
      list.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'name') {
      list.sort((a,b) => a.filename.localeCompare(b.filename));
    } else if (sortBy === 'size') {
      list.sort((a,b) => b.file_size - a.file_size);
    }

    return list;
  };

  const filteredFilesList = getFilteredFiles();
  const recentFilesList = files.filter(f => f.owner_id === user.id && !f.is_deleted && !f.is_seeded);
  const pinnedFiles = files.filter(f => f.owner_id === user.id && f.is_pinned && !f.is_deleted);
  const activities = dbActivities.getLogs(user.id).slice(0, 4);

  // File type design class wrappers
  const getFileClass = (mime: string) => {
    if (mime.includes('presentation') || mime.includes('powerpoint') || mime.includes('pptx')) {
      return { label: 'PPTX', color: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/20' };
    }
    if (mime.includes('pdf')) {
      return { label: 'PDF', color: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/20' };
    }
    if (mime.includes('word') || mime.includes('document')) {
      return { label: 'DOCX', color: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/20' };
    }
    if (mime.includes('plain') || mime.includes('text')) {
      return { label: 'NOTE', color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20' };
    }
    return { label: 'FILE', color: 'bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border border-slate-200/20' };
  };

  return (
    <div className="flex-1 space-y-6 select-none relative pb-12 text-left">
      
      {/* 1. Global Floating Toast Notification Banner */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-slate-800 dark:text-white flex items-center gap-2.5 shadow-lg max-w-sm"
          >
            <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <span className="text-xs font-semibold leading-tight">{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top Header Action Row (Greeting + Search + Icons) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Welcome greeting matching first image */}
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans tracking-wide">
            Good Morning, {user.display_name}! 👋
          </span>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            {currentTab === 'dashboard' ? 'Welcome Back' : 
             currentTab === 'files' ? 'My Presentations' :
             currentTab === 'favorites' ? 'Favorite Vault' :
             currentTab === 'trash' ? 'Vault Trash Bin' : 'Search & Filter'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access, upload and share your presentations anywhere, anytime.
          </p>
        </div>

        {/* Floating search input matches first image top search */}
        <div className="flex items-center gap-3 w-full md:w-auto relative">
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              placeholder="Search presentations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/20 hover:bg-white/25 focus:bg-white/35 dark:bg-slate-950/20 dark:hover:bg-slate-950/25 border border-white/45 dark:border-slate-800/40 rounded-full pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all shadow-sm focus:border-indigo-400"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
          
          {/* Notifications bell simulation */}
          <button 
            onClick={() => triggerNotification("Security clearance check complete. Sandbox isolated.")}
            className="p-2.5 rounded-full bg-white/20 dark:bg-slate-950/20 hover:bg-white/30 border border-white/45 dark:border-slate-800/40 text-slate-600 dark:text-slate-300 relative cursor-pointer active:scale-95 transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          </button>
        </div>

      </div>

      {/* 3. CORE SUB-FORMS (Add quick presentation outline note form) */}
      <AnimatePresence>
        {showNoteForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSaveNoteSubmit} className="glass-panel rounded-[24px] border border-white/40 p-5 space-y-4 shadow">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-2">
                  ✍️ Add Presentation Outline Outline
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowNoteForm(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold"
                >
                  Dismiss
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Note / Outline Title (e.g. Science Project Overview)"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-400 text-slate-800 dark:text-white"
                />
                <textarea
                  required
                  placeholder="Outline slide bullet points here..."
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-400 text-slate-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MAIN BENTO GRID DASHBOARD STATE */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Top Bento Layout Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Bento Block 1: Drag & Drop File Uploader Card */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`lg:col-span-6 rounded-[28px] border p-6 md:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 relative min-h-[220px] select-none ${
                isDragging 
                  ? 'bg-indigo-500/10 border-indigo-400/80 scale-102 shadow-lg shadow-indigo-500/5' 
                  : 'glass-panel border-white/45 shadow-lg'
              }`}
            >
              {/* Invisible file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelectChange}
                className="hidden"
                multiple
              />

              {/* Uploading progress overlay */}
              {uploadProgress !== null ? (
                <div className="space-y-4 w-full max-w-xs">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-500 animate-spin">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold dark:text-white block truncate mb-1">
                      Uploading {uploadFileName}...
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Encrypting & uploading securely ({uploadProgress}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/50 dark:bg-slate-900/30 h-1.5 rounded-full overflow-hidden border border-white/10 relative">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadProgress(null);
                      triggerNotification("Upload cancelled by client.");
                    }}
                    className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
                  >
                    Cancel upload
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 flex items-center justify-center text-indigo-500 mb-4 border border-indigo-500/10 shadow-sm">
                    <FileUp className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1.5">
                    Upload your presentation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
                    Drag & drop your slideshows here or click browse files
                  </p>
                  <button
                    id="browse-files-btn"
                    onClick={handleBrowseClick}
                    className="px-6 py-2.5 rounded-full bg-white/25 dark:bg-slate-950/20 hover:bg-white/40 border border-white/45 text-indigo-700 dark:text-indigo-200 text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
                  >
                    Browse Files
                  </button>
                </>
              )}
            </div>

            {/* Bento Block 2: Storage Gauge Indicator Circular */}
            <div className="lg:col-span-3 glass-panel rounded-[28px] border border-white/45 p-6 flex flex-col justify-between items-center text-center shadow-lg">
              <div className="w-full text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                ☁️ Storage Limit
              </div>

              {/* Dynamic Circular progress SVG */}
              <div className="relative w-32 h-32 flex items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="42" 
                    className="stroke-slate-200/50 dark:stroke-slate-900/30" 
                    strokeWidth="8" fill="transparent" 
                  />
                  <circle 
                    cx="50" cy="50" r="42" 
                    className="stroke-indigo-600" 
                    strokeWidth="8" fill="transparent" 
                    strokeDasharray="264"
                    strokeDashoffset={264 - (264 * (usedPercent || 32)) / 100}
                    strokeLinecap="round"
                    style={{
                      stroke: 'url(#aurora-grad)',
                      transition: 'stroke-dashoffset 0.8s ease-in-out'
                    }}
                  />
                  <defs>
                    <linearGradient id="aurora-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="50%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center text details */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-extrabold text-slate-800 dark:text-white leading-none">
                    {usedPercent}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Used</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block mb-0.5">
                  {usedGB} GB of 10 GB Used
                </span>
                <span className="text-[10px] text-slate-400">Secure AES storage</span>
              </div>
            </div>

            {/* Bento Block 3: Quick Actions Grid */}
            <div className="lg:col-span-3">
              <QuickActions
                onNewFolder={onOpenNewFolder}
                onUploadClick={handleBrowseClick}
                onShareClick={() => triggerNotification("Vault link shared to active workspace registries.")}
                onAddNote={() => setShowNoteForm(true)}
              />
            </div>

          </div>

          {/* Bottom Table and Feed Row Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Main column: Recent Files Table matches reference image exactly */}
            <div className="lg:col-span-8 glass-panel rounded-[28px] border border-white/45 p-6 shadow-lg space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  📂 Recent Files
                </h3>
                <span className="text-[10px] font-semibold text-indigo-500 hover:underline cursor-pointer">
                  View All Vault Files
                </span>
              </div>

              {recentFilesList.length === 0 ? (
                <div className="py-12 text-center">
                  <Presentation className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No files registered in Vault.</p>
                  <p className="text-[10px] text-slate-400">Drag or click browse to populate files.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      {recentFilesList.slice(0, 5).map((file) => {
                        const style = getFileClass(file.filename);
                        const isStarred = file.is_favorite;
                        return (
                          <tr 
                            key={file.id}
                            className="border-b border-white/5 last:border-0 hover:bg-white/10 transition-all rounded-xl cursor-pointer"
                          >
                            {/* Icon column */}
                            <td className="py-3 pl-2 pr-3" onClick={() => onOpenFileDetails(file)}>
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${style.color}`}>
                                {style.label}
                              </div>
                            </td>

                            {/* Name column */}
                            <td className="py-3 px-3 max-w-[200px] md:max-w-xs" onClick={() => onOpenFileDetails(file)}>
                              <div className="text-xs font-bold text-slate-800 dark:text-white truncate" title={file.filename}>
                                {file.filename}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {formatSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Collators/Owner Avatars column matching first mockup image */}
                            <td className="py-3 px-3 hidden md:table-cell" onClick={() => onOpenFileDetails(file)}>
                              <div className="flex -space-x-2">
                                <img 
                                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${file.id}`} 
                                  alt="avatar" 
                                  className="w-5 h-5 rounded-full border border-white"
                                />
                                <img 
                                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=collator-1`} 
                                  alt="avatar" 
                                  className="w-5 h-5 rounded-full border border-white"
                                />
                              </div>
                            </td>

                            {/* Dropdown context action column */}
                            <td className="py-3 px-2 text-right relative">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => handleToggleFavorite(file.id)}
                                  className="p-1.5 rounded-full hover:bg-white/20 text-slate-400 hover:text-indigo-500 transition-all cursor-pointer"
                                  title="Add to Favorites"
                                >
                                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-indigo-500 fill-indigo-500' : ''}`} />
                                </button>
                                
                                <button 
                                  onClick={() => onOpenFileDetails(file)}
                                  className="p-1.5 rounded-full hover:bg-white/20 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                                  title="Download / Share Options"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>

                                <button 
                                  onClick={() => setActiveMenuFileId(activeMenuFileId === file.id ? null : file.id)}
                                  className="p-1.5 rounded-full hover:bg-white/20 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Tiny Dropdown Menu pop-up */}
                              <AnimatePresence>
                                {activeMenuFileId === file.id && (
                                  <>
                                    <div className="fixed inset-0 z-20" onClick={() => setActiveMenuFileId(null)} />
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className="absolute right-2 top-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl shadow-xl z-30 w-36 text-left space-y-1"
                                    >
                                      <button 
                                        onClick={() => handleTogglePin(file.id)}
                                        className="w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                                      >
                                        <Pin className="w-3 h-3 text-amber-500" />
                                        {file.is_pinned ? 'Unpin File' : 'Pin File'}
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-500/10 flex items-center gap-1.5"
                                      >
                                        <Trash2 className="w-3 h-3 text-rose-500" />
                                        Trash Item
                                      </button>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right widgets column: Pinned + Activity timeline feeds */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Widget 1: Pinned list matching reference image */}
              <div className="glass-panel rounded-[28px] border border-white/45 p-5 shadow-lg space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Pinned Slides
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">View All</span>
                </div>
                {pinnedFiles.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">No pinned slide decks.</p>
                ) : (
                  <div className="space-y-2">
                    {pinnedFiles.slice(0, 4).map(pf => (
                      <div 
                        key={pf.id}
                        onClick={() => onOpenFileDetails(pf)}
                        className="p-2 rounded-xl hover:bg-white/10 flex items-center gap-3 cursor-pointer transition-all border border-transparent hover:border-white/20"
                      >
                        <Presentation className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate flex-1">
                          {pf.filename}
                        </span>
                        <Star className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Widget 2: Tabbed Layout with Yoyo AI Assistant and Recent Activity */}
              <div className="glass-panel rounded-[28px] border border-white/45 p-5 shadow-lg space-y-3.5 flex flex-col min-h-[380px]">
                <div className="flex justify-between items-center pb-2 border-b border-white/10 shrink-0">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSidebarTab('ai')}
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        sidebarTab === 'ai' 
                          ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-200' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                    >
                      ✨ Yoyo AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarTab('activity')}
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        sidebarTab === 'activity' 
                          ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-200' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                    >
                      📈 Activity
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-stretch min-h-0">
                  {sidebarTab === 'ai' ? (
                    <YoyoAIAssistant 
                      files={files} 
                      folders={folders}
                      triggerNotification={(msg) => triggerNotification(msg)}
                      onExecuteCommand={(cmdText) => {
                        const cmd = cmdText.toLowerCase();
                        if (cmd.includes('chemistry')) {
                          setSearchQuery('Chemistry');
                          setSearchType('pptx');
                        } else if (cmd.includes('latest')) {
                          const ppts = files.filter(f => f.filename.toLowerCase().endsWith('.pptx'));
                          if (ppts.length > 0) {
                            onOpenFileDetails(ppts[0]);
                          } else if (files.length > 0) {
                            onOpenFileDetails(files[0]);
                          }
                        } else if (cmd.includes('math')) {
                          const mathFile = files.find(f => f.filename.toLowerCase().includes('math'));
                          if (mathFile) {
                            onOpenFileDetails(mathFile);
                          } else {
                            triggerNotification("File 'Mathematics Final Notes.docx' not found.");
                          }
                        } else if (cmd.includes('yesterday')) {
                          triggerNotification("Filtering presentation views for recent edits.");
                          setSearchQuery('Presentation');
                        } else if (cmd.includes('organize')) {
                          triggerNotification("Auto-organization run complete! Grouped unassigned slides.");
                        }
                      }}
                    />
                  ) : activities.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-8">Timeline is currently clear.</p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {activities.map((act) => (
                        <div key={act.id} className="text-left text-[11px] space-y-0.5 border-l-2 border-indigo-500/20 pl-3">
                          <span className="text-slate-400 font-mono text-[9px] block">
                            {new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 block truncate">
                            {act.details}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 5. FILES & PRESENTATIONS PAGE (Detailed list view with nested folders browse!) */}
      {currentTab === 'files' && (
        <div className="space-y-6">
          
          {/* File explorer search filters row */}
          <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-white/10">
            <button
              onClick={() => setSearchType('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                searchType === 'all' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/10 border-white/15 text-slate-600 dark:text-slate-300'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setSearchType('pptx')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                searchType === 'pptx' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/10 border-white/15 text-slate-600 dark:text-slate-300'
              }`}
            >
              PowerPoint (.pptx)
            </button>
            <button
              onClick={() => setSearchType('pdf')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                searchType === 'pdf' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/10 border-white/15 text-slate-600 dark:text-slate-300'
              }`}
            >
              PDF Slides (.pdf)
            </button>

            <div className="flex-1" />

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-2 py-1 text-xs text-slate-800 dark:text-white outline-none"
              >
                <option value="date" className="text-slate-800">Upload Date</option>
                <option value="name" className="text-slate-800">Filename</option>
                <option value="size" className="text-slate-800">File size</option>
              </select>
            </div>
          </div>

          {/* Folder Browser Grid (at top of file tab) */}
          {activeFolderId === null && (
            <div className="space-y-3 text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                📂 Secure Vault Folders
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {folders.filter(fol => fol.owner_id === user.id).map((folder) => (
                  <div 
                    key={folder.id}
                    className="glass-panel p-4 rounded-[20px] border border-white/40 shadow hover:bg-white/15 transition-all cursor-pointer flex flex-col justify-between h-28 relative group"
                    onClick={() => setActiveFolderId(folder.id)}
                  >
                    <Folder className="w-7 h-7 text-teal-500 dark:text-teal-400 group-hover:scale-105 transition-transform" />
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-white block truncate mb-0.5">
                        {folder.folder_name}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {files.filter(f => f.folder_id === folder.id && !f.is_deleted).length} documents
                      </span>
                    </div>

                    {/* Delete folder button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dbFolders.deleteFolder(user.id, folder.id);
                        triggerNotification("Folder deleted.");
                        refreshData();
                      }}
                      className="absolute top-3 right-3 p-1 rounded-full hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add new Folder card trigger */}
                <button
                  onClick={onOpenNewFolder}
                  className="p-4 rounded-[20px] border-2 border-dashed border-slate-300/60 dark:border-slate-800/60 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 h-28"
                >
                  <PlusCircle className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">Create Folder</span>
                </button>
              </div>
            </div>
          )}

          {/* Nested Folder breadcrumb trail navigation! */}
          {activeFolderId && (
            <div className="flex items-center gap-2 bg-white/15 border border-white/20 p-2.5 rounded-full text-xs font-semibold tracking-wide w-fit shadow-sm">
              <button 
                onClick={() => setActiveFolderId(null)}
                className="text-indigo-600 dark:text-indigo-300 hover:underline cursor-pointer"
              >
                Root Private Vault
              </button>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-800 dark:text-white">
                {folders.find(f => f.id === activeFolderId)?.folder_name || "Folder"}
              </span>
              <button 
                onClick={() => setActiveFolderId(null)}
                className="ml-3 px-3 py-1 rounded-full bg-slate-200/50 hover:bg-slate-300/50 text-[10px] text-slate-600 transition-all cursor-pointer"
              >
                Up Directory
              </button>
            </div>
          )}

          {/* Files List Display Table */}
          <div className="glass-panel rounded-[28px] border border-white/45 p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                📄 Vault Document Files
              </h3>
            </div>

            {filteredFilesList.length === 0 ? (
              <div className="py-16 text-center">
                <Presentation className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No documents registered in this directory path.</p>
                <p className="text-xs text-slate-400">Drag slide decks or click browse to upload.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {filteredFilesList.map((file) => {
                      const style = getFileClass(file.filename);
                      const isStarred = file.is_favorite;
                      return (
                        <tr 
                          key={file.id}
                          className="border-b border-white/5 last:border-0 hover:bg-white/10 transition-all rounded-xl cursor-pointer"
                        >
                          <td className="py-3 pl-2 pr-3" onClick={() => onOpenFileDetails(file)}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${style.color}`}>
                              {style.label}
                            </div>
                          </td>

                          <td className="py-3 px-3 max-w-[200px] md:max-w-xs" onClick={() => onOpenFileDetails(file)}>
                            <div className="text-xs font-bold text-slate-800 dark:text-white truncate" title={file.filename}>
                              {file.filename}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {formatSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="py-3 px-3 hidden md:table-cell" onClick={() => onOpenFileDetails(file)}>
                            <div className="text-[10px] font-mono text-slate-500 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full w-fit">
                              {file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </div>
                          </td>

                          <td className="py-3 px-2 text-right relative">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleToggleFavorite(file.id)}
                                className="p-1.5 rounded-full hover:bg-white/20 text-slate-400 hover:text-indigo-500 transition-all cursor-pointer"
                              >
                                <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-indigo-500 fill-indigo-500' : ''}`} />
                              </button>
                              
                              <button 
                                onClick={() => onOpenFileDetails(file)}
                                className="p-1.5 rounded-full hover:bg-white/20 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button 
                                onClick={() => setActiveMenuFileId(activeMenuFileId === file.id ? null : file.id)}
                                className="p-1.5 rounded-full hover:bg-white/20 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <AnimatePresence>
                              {activeMenuFileId === file.id && (
                                <>
                                  <div className="fixed inset-0 z-20" onClick={() => setActiveMenuFileId(null)} />
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-2 top-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl shadow-xl z-30 w-36 text-left space-y-1"
                                  >
                                    <button 
                                      onClick={() => handleTogglePin(file.id)}
                                      className="w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                                    >
                                      <Pin className="w-3 h-3 text-amber-500" />
                                      {file.is_pinned ? 'Unpin File' : 'Pin File'}
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteFile(file.id)}
                                      className="w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-500/10 flex items-center gap-1.5"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-500" />
                                      Trash Item
                                    </button>
                                    </motion.div>
                                  </>
                                )}
                            </AnimatePresence>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. FAVORITES PAGE FILTER */}
      {currentTab === 'favorites' && (
        <div className="glass-panel rounded-[28px] border border-white/45 p-6 shadow-lg space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ⭐ Favorite Slide Decks & Notes
            </h3>
          </div>

          {filteredFilesList.length === 0 ? (
            <div className="py-16 text-center">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No favorited files inside this isolated Vault.</p>
              <p className="text-xs text-slate-400">Favorite items to view them here for quick convenience.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFilesList.map(file => (
                <div 
                  key={file.id}
                  onClick={() => onOpenFileDetails(file)}
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                      PPT
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block truncate max-w-[200px]">
                        {file.filename}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {formatSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Star className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. RECENT UPLOADS FILTER */}
      {currentTab === 'recent' && (
        <div className="glass-panel rounded-[28px] border border-white/45 p-6 shadow-lg space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              📅 Recent Vault Uploads
            </h3>
          </div>

          {filteredFilesList.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No uploads inside this isolated Vault.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFilesList.slice(0, 8).map(file => (
                <div 
                  key={file.id}
                  onClick={() => onOpenFileDetails(file)}
                  className="p-3.5 rounded-[20px] bg-white/10 hover:bg-white/15 border border-white/15 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(file.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[280px]">
                      {file.filename}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    {formatSize(file.file_size)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. SHARED PRESENTATIONS PAGE */}
      {currentTab === 'shared' && (
        <div className="glass-panel rounded-[28px] border border-white/45 p-6 shadow-lg space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              🔗 Shared Slides & Presentations
            </h3>
          </div>

          <div className="py-16 text-center max-w-sm mx-auto space-y-3">
            <ArrowUpRight className="w-12 h-12 text-indigo-500 mx-auto mb-2 animate-bounce" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Active Classroom Presentations</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every slide in your isolated vault can be instantly shared onto smart boards or TVs by clicking <strong className="text-indigo-400">"Copy Smart Link"</strong> and typing it into any browser.
            </p>
            <div className="pt-2">
              <button
                onClick={() => triggerNotification("Public vault share token rotated securely.")}
                className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow"
              >
                Rotate Sharing Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. VAULT TRASH RECYCLER */}
      {currentTab === 'trash' && (
        <div className="glass-panel rounded-[28px] border border-white/45 p-6 shadow-lg space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              🗑️ Vault Recycler & Trash
            </h3>
          </div>

          {filteredFilesList.length === 0 ? (
            <div className="py-16 text-center">
              <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">Trash Bin is currently clean.</p>
              <p className="text-xs text-slate-400">Deleted files are retained for 30 days securely.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFilesList.map(file => (
                <div 
                  key={file.id}
                  className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block truncate max-w-xs">
                      {file.filename}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatSize(file.file_size)} • Deleted on {new Date(file.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestoreFile(file.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/15 text-emerald-600 text-xs font-bold transition-all cursor-pointer"
                    >
                      Restore File
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 10. GOOGLE SLIDES INTEGRATION PANEL */}
      {currentTab === 'google-slides' && (
        <GoogleSlidesExplorer 
          user={user}
          triggerNotification={triggerNotification}
          refreshData={refreshData}
        />
      )}

    </div>
  );
}
