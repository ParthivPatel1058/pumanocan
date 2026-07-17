import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Presentation, Search, ExternalLink, RefreshCw, Key, Download, Check, 
  Sparkles, Sliders, Play, X, ShieldAlert, FileSpreadsheet, FileText, ArrowRight, HelpCircle
} from 'lucide-react';
import { googleSignIn, getAccessToken, logoutFirebase } from '../lib/firebase';
import { dbFiles } from '../lib/db';
import { Profile } from '../types';

interface GoogleSlidesExplorerProps {
  user: Profile;
  triggerNotification: (msg: string) => void;
  refreshData: () => void;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  modifiedTime?: string;
}

export default function GoogleSlidesExplorer({ 
  user, 
  triggerNotification, 
  refreshData 
}: GoogleSlidesExplorerProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [slides, setSlides] = useState<GoogleDriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected slide presentation for premium embedded viewer
  const [selectedPresentation, setSelectedPresentation] = useState<GoogleDriveFile | null>(null);
  const [presentationDetails, setPresentationDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  // Check if we already have an active access token in memory
  useEffect(() => {
    const fetchToken = async () => {
      const activeToken = await getAccessToken();
      if (activeToken) {
        setToken(activeToken);
        loadSlides(activeToken);
      }
    };
    fetchToken();
  }, []);

  // Log in to Google to retrieve Drive and Slides scopes
  const handleConnectGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result && result.accessToken) {
        setToken(result.accessToken);
        triggerNotification("Successfully connected Google Workspace!");
        loadSlides(result.accessToken);
      } else {
        setError("Could not retrieve authorization credentials.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authorize Google Workspace.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Slides Presentations from Google Drive
  const loadSlides = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      // Query parameters for files that are Google Slides presentations
      const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.presentation' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink,thumbnailLink,iconLink,modifiedTime)&pageSize=25`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          setToken(null);
          throw new Error("Your access token has expired. Please reconnect.");
        }
        throw new Error("Failed to load slideshow presentations from Google Drive.");
      }

      const data = await res.json();
      setSlides(data.files || []);
    } catch (err: any) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed presentation slides metadata
  const loadPresentationDetails = async (presentationId: string, accessToken: string) => {
    setDetailsLoading(true);
    setPresentationDetails(null);
    try {
      const res = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (res.ok) {
        const details = await res.json();
        setPresentationDetails(details);
      }
    } catch (err) {
      console.error("Error fetching detailed slide pages", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle slide select preview
  const handleSelectSlide = (slideFile: GoogleDriveFile) => {
    setSelectedPresentation(slideFile);
    if (token) {
      loadPresentationDetails(slideFile.id, token);
    }
  };

  // Import Presentation into local Pumanocan isolated vault as shortcut shortcut Link
  const handleImportShortcut = (slide: GoogleDriveFile) => {
    try {
      dbFiles.uploadFile(
        user.id,
        `[Google Slide] ${slide.name}`,
        0, // 0 bytes as it's a shortcut Link
        'application/vnd.google-apps.presentation',
        null, // Root directory
        slide.webViewLink || `https://docs.google.com/presentation/d/${slide.id}`
      );
      triggerNotification(`Imported "${slide.name}" shortcut to Pumanocan Vault!`);
      refreshData();
    } catch (err) {
      triggerNotification("Failed to import slide shortcut.");
    }
  };

  const filteredSlides = slides.filter(slide => 
    slide.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Presentation className="w-5 h-5 text-indigo-500" />
            Google Slides Integration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access, view and present your real Google Drive presentation decks directly from within your private sandbox.
          </p>
        </div>
        
        {token && (
          <button
            onClick={() => token && loadSlides(token)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-slate-950/20 hover:bg-white/15 border border-white/20 text-xs font-semibold text-slate-800 dark:text-white transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Slides
          </button>
        )}
      </div>

      {/* 1. NOT AUTHENTICATED STATE */}
      {!token ? (
        <div className="liquid-glass rounded-[32px] p-8 md:p-12 text-center max-w-lg mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center mx-auto shadow-md">
            <Presentation className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Connect Google Workspace</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              We require read-only access to search your Google Drive and Slides to let you display slide decks dynamically from classroom computers without a USB.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-2xl border bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-200 text-xs flex items-center gap-2.5 max-w-xs mx-auto">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Official Google Brand Button */}
          <button
            onClick={handleConnectGoogle}
            disabled={loading}
            className="px-6 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-sans font-semibold text-sm shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            )}
            Authorize Google Account
          </button>
        </div>
      ) : (
        
        /* 2. AUTHENTICATED MAIN BROWSER LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: presentations list browser */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Slide Search inputs */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Google Slides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 dark:bg-slate-900/20 border border-slate-300/60 dark:border-white/15 rounded-full px-5 py-3 pl-11 text-xs text-slate-800 dark:text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500"
              />
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            </div>

            {/* List browser container */}
            <div className="glass-panel rounded-[24px] border border-white/45 overflow-hidden p-3 shadow-md max-h-[500px] overflow-y-auto space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-white/10">
                ☁️ Presentations on Drive
              </div>
              
              {loading && slides.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  <p className="text-xs">Accessing Google Drive files...</p>
                </div>
              ) : filteredSlides.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <Presentation className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-bold">No slideshow decks found.</p>
                  <p className="text-[10px] text-slate-500">Create a Google Slide on Drive first.</p>
                </div>
              ) : (
                filteredSlides.map((slide) => {
                  const isSelected = selectedPresentation?.id === slide.id;
                  return (
                    <div
                      key={slide.id}
                      onClick={() => handleSelectSlide(slide)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center justify-between text-left ${
                        isSelected 
                          ? 'bg-indigo-500/15 border-indigo-400/40 text-indigo-900 dark:text-indigo-200 shadow-sm' 
                          : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                          <Presentation className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold truncate block">
                            {slide.name}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            Modified: {slide.modifiedTime ? new Date(slide.modifiedTime).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          title="Import Shortcut"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImportShortcut(slide);
                          }}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/20 text-indigo-500 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: presentation interactive viewer & slide content details */}
          <div className="lg:col-span-2 space-y-4">
            {selectedPresentation ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Embedded HTML presentation viewer frame */}
                <div className="liquid-glass rounded-[28px] overflow-hidden border border-white/45 shadow-lg bg-black/5 relative">
                  
                  {/* Presentation header info bar */}
                  <div className="px-4 py-3 bg-white/20 dark:bg-slate-950/40 border-b border-white/10 flex justify-between items-center z-10 relative">
                    <div className="flex items-center gap-2">
                      <Presentation className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[280px]">
                        {selectedPresentation.name}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <a 
                        href={selectedPresentation.webViewLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/15 text-[10px] font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1 transition-all"
                      >
                        Open In Drive
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* HTML Iframe embed */}
                  <div className="relative aspect-video w-full bg-slate-950/30 flex items-center justify-center">
                    <iframe
                      src={`https://docs.google.com/presentation/d/${selectedPresentation.id}/embed?start=false&loop=false&delayms=3000`}
                      className="absolute inset-0 w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Slides deck metadata structure */}
                <div className="glass-panel rounded-[24px] border border-white/45 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Presentation Structure & Analysis
                    </h4>
                    {presentationDetails && (
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {presentationDetails.slides?.length || 0} Slides
                      </span>
                    )}
                  </div>

                  {detailsLoading ? (
                    <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                      Scanning presentation slides...
                    </div>
                  ) : presentationDetails ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto p-1">
                      {presentationDetails.slides?.map((slide: any, index: number) => (
                        <div 
                          key={slide.objectId || index}
                          className="p-3 rounded-xl bg-white/5 dark:bg-slate-900/10 border border-white/10 text-center flex flex-col justify-between items-center h-20 transition-all hover:bg-white/10 hover:border-white/20"
                        >
                          <span className="text-[10px] font-mono text-slate-400 block mb-1">
                            Slide {index + 1}
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 block line-clamp-2 leading-tight">
                            {slide.pageElements?.find((el: any) => el.shape?.shapeType === 'TEXT_BOX')?.shape?.placeholder?.type || "Standard Layout"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      Select a presentation slide deck to review its pages structure.
                    </p>
                  )}
                </div>

              </motion.div>
            ) : (
              <div className="liquid-glass rounded-[32px] p-16 text-center text-slate-400 flex flex-col justify-center items-center h-full min-h-[350px] space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-500 animate-pulse">
                  <Play className="w-6 h-6 ml-0.5" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Active Presentation Deck View</h4>
                  <p className="text-xs text-slate-500">
                    Select any presentation slideshow from Google Drive on the left sidebar list to present, stream, and embed it dynamically.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
