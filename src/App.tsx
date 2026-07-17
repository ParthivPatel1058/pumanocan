import React, { useState, useEffect } from 'react';
import { Profile, Folder, FileItem, AppSettings } from './types';
import { dbAuth, dbFiles, dbFolders, dbActivities, dbSettings } from './lib/db';
import Background from './components/Background';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AddFolderModal from './components/AddFolderModal';
import FileDetailsModal from './components/FileDetailsModal';
import SettingsPage from './components/SettingsPage';
import CommandPalette from './components/CommandPalette';
import YoyoPresentMode from './components/YoyoPresentMode';
import { Cloud, Lock } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { firestore } from './lib/firebase';
import { supabaseSync } from './lib/supabase';

export default function App() {
  // Screen Route state: 'landing' | 'auth' | 'app'
  const [route, setRoute] = useState<'landing' | 'auth' | 'app'>('landing');
  
  // Current tab in main app: 'dashboard' | 'files' | 'recent' | 'shared' | 'favorites' | 'trash' | 'settings' | 'yoyo-present'
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [postAuthTab, setPostAuthTab] = useState<string>('dashboard');

  // Active User session
  const [user, setUser] = useState<Profile | null>(null);

  // Files & folders state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  // Application Settings (Dark Mode, Background selection, Glass intensity)
  const [settings, setSettings] = useState<AppSettings>(dbSettings.getSettings());

  // Active dialog modals states
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isFileDetailsOpen, setIsFileDetailsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + K: Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // CMD/CTRL + N: New Folder Modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsFolderModalOpen(true);
      }
      // CMD/CTRL + U: Upload trigger simulation
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        const fileBtn = document.getElementById('browse-files-btn');
        if (fileBtn) {
          fileBtn.click();
        } else {
          // If not in dashboard, switch to dashboard
          setCurrentTab('dashboard');
          setTimeout(() => {
            document.getElementById('browse-files-btn')?.click();
          }, 100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync data from Firestore
  const syncWithCloud = async (userId: string) => {
    try {
      await Promise.all([
        dbFiles.syncFromFirestore(userId),
        dbFolders.syncFromFirestore(userId),
        dbActivities.syncFromFirestore(userId)
      ]);
      loadUserData(userId);
    } catch (err) {
      console.error("Failed to sync from cloud on startup", err);
    }
  };

  // Load user session on startup
  useEffect(() => {
    const session = dbAuth.getCurrentSession();
    if (session) {
      setUser(session);
      setRoute('app');
      loadUserData(session.id);
      syncWithCloud(session.id);
    }
  }, []);

  // Real-time Cloud Synchronization (Cross-Device Sync)
  useEffect(() => {
    if (!user) return;

    // 1. Live stream files changes in real-time
    const filesQuery = query(collection(firestore, 'files'), where('owner_id', '==', user.id));
    const unsubscribeFiles = onSnapshot(filesQuery, (snapshot) => {
      const dbFilesList: FileItem[] = [];
      snapshot.forEach((doc) => {
        dbFilesList.push(doc.data() as FileItem);
      });
      setFiles(dbFilesList);
      localStorage.setItem('pumanocan_files', JSON.stringify(dbFilesList));
    }, (error) => {
      console.error("Realtime files listener failed:", error);
    });

    // 2. Live stream folders changes in real-time
    const foldersQuery = query(collection(firestore, 'folders'), where('owner_id', '==', user.id));
    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const dbFoldersList: Folder[] = [];
      snapshot.forEach((doc) => {
        dbFoldersList.push(doc.data() as Folder);
      });
      setFolders(dbFoldersList);
      localStorage.setItem('pumanocan_folders', JSON.stringify(dbFoldersList));
    }, (error) => {
      console.error("Realtime folders listener failed:", error);
    });

    // 3. Live stream activity log changes in real-time
    const activitiesQuery = query(collection(firestore, 'activities'), where('owner_id', '==', user.id));
    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const dbActivitiesList: any[] = [];
      snapshot.forEach((doc) => {
        dbActivitiesList.push(doc.data());
      });
      localStorage.setItem('pumanocan_activities', JSON.stringify(dbActivitiesList));
    }, (error) => {
      console.error("Realtime activities listener failed:", error);
    });

    return () => {
      unsubscribeFiles();
      unsubscribeFolders();
      unsubscribeActivities();
    };
  }, [user]);

  // Sync settings theme classes with document body
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    dbSettings.saveSettings(settings);
  }, [settings]);

  // Load user isolated resources
  const loadUserData = (userId: string) => {
    const userFiles = dbFiles.getFiles(userId);
    const userFolders = dbFolders.getFolders(userId);
    setFiles(userFiles);
    setFolders(userFolders);
  };

  const handleAuthSuccess = (profile: Profile) => {
    setUser(profile);
    setRoute('app');
    setCurrentTab(postAuthTab);
    setPostAuthTab('dashboard');
    loadUserData(profile.id);
    syncWithCloud(profile.id);
  };

  const handleLogout = () => {
    dbAuth.signOut();
    setUser(null);
    setRoute('landing');
    setCurrentTab('dashboard');
    setFiles([]);
    setFolders([]);
  };

  const handleCreateFolder = (name: string, parentId?: string) => {
    if (!user) return;
    dbFolders.createFolder(user.id, name, parentId);
    loadUserData(user.id);
  };

  const handleOpenFileDetails = (file: FileItem) => {
    setSelectedFile(file);
    setIsFileDetailsOpen(true);
  };

  // Standard File Action Handlers to refresh local component states
  const handleTogglePin = (id: string) => {
    if (!user) return;
    dbFiles.togglePinFile(user.id, id);
    loadUserData(user.id);
    // Refresh modal reference
    if (selectedFile?.id === id) {
      const updated = dbFiles.getFiles(user.id).find(f => f.id === id);
      if (updated) setSelectedFile(updated);
    }
  };

  const handleToggleFavorite = (id: string) => {
    if (!user) return;
    dbFiles.toggleFavoriteFile(user.id, id);
    loadUserData(user.id);
    if (selectedFile?.id === id) {
      const updated = dbFiles.getFiles(user.id).find(f => f.id === id);
      if (updated) setSelectedFile(updated);
    }
  };

  const handleMoveFile = (id: string, folderId: string | null) => {
    if (!user) return;
    dbFiles.moveFile(user.id, id, folderId);
    loadUserData(user.id);
    if (selectedFile?.id === id) {
      const updated = dbFiles.getFiles(user.id).find(f => f.id === id);
      if (updated) setSelectedFile(updated);
    }
  };

  const handleDeleteFile = (id: string) => {
    if (!user) return;
    dbFiles.deleteFile(user.id, id);
    loadUserData(user.id);
  };

  const handleDownloadFile = (file: FileItem) => {
    // Simulated count addition in DB
    if (!user) return;
    
    // In local demo, file_url is often a Blob Object URL or simple mock placeholder.
    // If it's a real Blob URL, we will trigger genuine browser download!
    const link = document.createElement('a');
    link.href = file.file_url === '#' ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80' : file.file_url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Increment download metrics
    const list = [...files];
    const index = list.findIndex(f => f.id === file.id);
    if (index !== -1) {
      list[index].download_count += 1;
      setFiles(list);
      localStorage.setItem('pumanocan_files', JSON.stringify(list));
    }
  };

  const handleUpdatePasscode = async (newPasscode: string): Promise<void> => {
    if (!user) return;
    // Update PIN passcode
    const profiles = JSON.parse(localStorage.getItem('pumanocan_profiles') || '[]');
    const index = profiles.findIndex((p: any) => p.id === user.id);
    if (index !== -1) {
      const encrypted = await import('./lib/crypto').then(c => c.encryptData(newPasscode, 'pumanocan-vault-passcode-key'));
      profiles[index].passcode = encrypted;
      localStorage.setItem('pumanocan_profiles', JSON.stringify(profiles));
      
      const updatedUser = { ...user, passcode: encrypted };
      setUser(updatedUser);

      // Save to Firestore
      await setDoc(doc(firestore, 'profiles', user.id), updatedUser).catch(err => {
        console.error('Failed to update passcode in Firestore:', err);
      });

      // Sync to Supabase
      supabaseSync.upsertProfile(updatedUser);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden antialiased">
      
      {/* Dynamic Animated Glass & Aurora Background */}
      <Background settings={settings} />

      {/* Screen Routing with smooth transition layers */}
      {route === 'landing' && (
        <LandingPage 
          onGetStarted={() => {
            setRoute('auth');
          }}
          onSignInClick={() => {
            setRoute('auth');
          }}
          onPresentModeClick={() => {
            if (user) {
              setRoute('app');
              setCurrentTab('yoyo-present');
            } else {
              setPostAuthTab('yoyo-present');
              setRoute('auth');
            }
          }}
          settings={settings}
        />
      )}

      {route === 'auth' && (
        <AuthPage 
          onAuthSuccess={handleAuthSuccess}
          onBackToLanding={() => setRoute('landing')}
        />
      )}

      {route === 'app' && user && (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-10 flex flex-col md:flex-row gap-6 relative z-10 h-screen overflow-hidden">
          
          {/* Left Floating Sidebar panel */}
          <Sidebar 
            currentTab={currentTab}
            setCurrentTab={(tab) => {
              setCurrentTab(tab);
            }}
            user={user}
            files={files}
            onLogout={handleLogout}
            onOpenSettings={() => setCurrentTab('settings')}
          />

          {/* Right Main Content Panel */}
          <div className="flex-1 liquid-glass rounded-[32px] border border-white/35 p-6 md:p-8 overflow-y-auto shadow-2xl h-full relative">
            {/* Animated liquid light blobs inside the container to simulate fluid refraction */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 rounded-[30px]">
              <div className="absolute w-72 h-72 rounded-full bg-[#1e40af]/15 blur-[60px] -top-20 -left-20 animate-fluid-1" />
              <div className="absolute w-80 h-80 rounded-full bg-[#701a75]/12 blur-[65px] -bottom-24 -right-16 animate-fluid-2" />
            </div>
            
            {currentTab === 'settings' ? (
              <SettingsPage 
                settings={settings}
                onSaveSettings={(newSet) => setSettings(newSet)}
                user={user}
                onUpdatePasscode={handleUpdatePasscode}
              />
            ) : currentTab === 'yoyo-present' ? (
              <YoyoPresentMode 
                files={files}
                triggerNotification={(msg) => {
                  // Dispatch simple notification event or trigger dashboard-like local feedback
                  const customEvt = new CustomEvent('yoyo-notification', { detail: msg });
                  window.dispatchEvent(customEvt);
                }}
                onBackToDashboard={() => setCurrentTab('dashboard')}
              />
            ) : (
              <Dashboard 
                user={user}
                files={files}
                folders={folders}
                currentTab={currentTab}
                refreshData={() => loadUserData(user.id)}
                onOpenFileDetails={handleOpenFileDetails}
                onOpenNewFolder={() => setIsFolderModalOpen(true)}
              />
            )}

          </div>

        </div>
      )}

      {/* GLOBAL DISMISSABLE MODAL WINDOWS */}
      <AddFolderModal 
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={handleCreateFolder}
        existingFolders={folders.filter(f => f.owner_id === user?.id)}
      />

      <FileDetailsModal 
        isOpen={isFileDetailsOpen}
        onClose={() => setIsFileDetailsOpen(false)}
        file={selectedFile}
        folders={folders.filter(f => f.owner_id === user?.id)}
        onTogglePin={handleTogglePin}
        onToggleFavorite={handleToggleFavorite}
        onMoveFile={handleMoveFile}
        onDeleteFile={handleDeleteFile}
        onDownload={handleDownloadFile}
      />

      {route === 'app' && user && (
        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          files={files}
          folders={folders}
          onSelectFile={handleOpenFileDetails}
          onOpenNewFolder={() => setIsFolderModalOpen(true)}
          onOpenSettings={() => setCurrentTab('settings')}
          onUploadTrigger={() => {
            const uploadBtn = document.getElementById('browse-files-btn');
            if (uploadBtn) uploadBtn.click();
          }}
          onSwitchTab={(tab) => setCurrentTab(tab)}
          onToggleTheme={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
          isDarkMode={settings.darkMode}
        />
      )}

    </div>
  );
}
