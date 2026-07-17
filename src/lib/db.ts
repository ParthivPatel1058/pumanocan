import { Profile, Folder, FileItem, ActivityLog, AppSettings } from '../types';
import { encryptData, decryptData } from './crypto';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from './firebase';
import { supabaseSync, getSupabaseConfig, getSupabaseClient } from './supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Keys for localStorage
const SESSION_KEY = 'pumanocan_session';
const PROFILES_KEY = 'pumanocan_profiles';
const FILES_KEY = 'pumanocan_files';
const FOLDERS_KEY = 'pumanocan_folders';
const ACTIVITIES_KEY = 'pumanocan_activities';
const SETTINGS_KEY = 'pumanocan_settings';

// Default App Settings
export const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  glassIntensity: 25,
  backgroundImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80', // Beautiful aurora clouds background
  language: 'en'
};

/**
 * Generate a random UUID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Read item from local storage with safety fallback
 */
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultValue;
  }
}

/**
 * Write item to local storage
 */
function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage`, err);
  }
}

/**
 * Security: Encrypt critical profile credentials
 */
export async function encryptProfileCredentials(password: string): Promise<string> {
  return await encryptData(password, 'pumanocan-vault-core-key');
}

/**
 * Security: Verify encrypted password
 */
export async function verifyProfileCredentials(password: string, encryptedHash: string): Promise<boolean> {
  try {
    const decrypted = await decryptData(encryptedHash, 'pumanocan-vault-core-key');
    return decrypted === password;
  } catch {
    return false;
  }
}

/**
 * Seed sample data for high-fidelity experience matching the reference screenshots
 */
export function seedSampleData(userId: string, displayName: string): { files: FileItem[]; folders: Folder[] } {
  const folders: Folder[] = [
    {
      id: 'f-annual',
      owner_id: userId,
      folder_name: 'Annual Reports',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_pinned: true
    },
    {
      id: 'f-presentations',
      owner_id: userId,
      folder_name: 'Presentations',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      is_favorite: true
    },
    {
      id: 'f-marketing',
      owner_id: userId,
      folder_name: 'Marketing Decks',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const files: FileItem[] = [
    {
      id: 'file-1',
      owner_id: userId,
      folder_id: 'f-annual',
      filename: 'SDPS Annual Report 2025.pptx',
      file_url: '#',
      file_size: 2.4 * 1024 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      download_count: 3,
      is_seeded: true
    },
    {
      id: 'file-2',
      owner_id: userId,
      folder_id: 'f-presentations',
      filename: 'Science Project Presentation.pptx',
      file_url: '#',
      file_size: 5.1 * 1024 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      download_count: 14,
      is_favorite: true,
      is_seeded: true
    },
    {
      id: 'file-3',
      owner_id: userId,
      folder_id: null,
      filename: 'Business Plan 2025.pdf',
      file_url: '#',
      file_size: 3.8 * 1024 * 1024,
      mime_type: 'application/pdf',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      download_count: 22,
      is_pinned: true,
      is_seeded: true
    },
    {
      id: 'file-4',
      owner_id: userId,
      folder_id: 'f-marketing',
      filename: 'Marketing Strategy Deck.pptx',
      file_url: '#',
      file_size: 6.2 * 1024 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      download_count: 8,
      is_pinned: true,
      is_seeded: true
    },
    {
      id: 'file-5',
      owner_id: userId,
      folder_id: null,
      filename: 'Class 10 Notes.docx',
      file_url: '#',
      file_size: 1.2 * 1024 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      download_count: 5,
      is_seeded: true
    },
    {
      id: 'file-6',
      owner_id: userId,
      folder_id: null,
      filename: 'Important Presentation.pptx',
      file_url: '#',
      file_size: 8.5 * 1024 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      download_count: 40,
      is_pinned: true,
      is_favorite: true,
      is_seeded: true
    },
    {
      id: 'file-7',
      owner_id: userId,
      folder_id: null,
      filename: 'Board Meeting Deck.pptx',
      file_url: '#',
      file_size: 12.1 * 1024 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      download_count: 11,
      is_pinned: true,
      is_seeded: true
    },
    {
      id: 'file-8',
      owner_id: userId,
      folder_id: 'f-annual',
      filename: 'SDPS Highlights.pdf',
      file_url: '#',
      file_size: 1.7 * 1024 * 1024,
      mime_type: 'application/pdf',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      download_count: 19,
      is_pinned: true,
      is_favorite: true,
      is_seeded: true
    },
    {
      id: 'file-chemistry',
      owner_id: userId,
      folder_id: 'f-presentations',
      filename: 'Chemistry Presentation.pptx',
      file_url: '#',
      file_size: 4.8 * 1024 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // uploaded yesterday!
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      download_count: 6,
      is_favorite: true,
      is_seeded: true
    },
    {
      id: 'file-math',
      owner_id: userId,
      folder_id: null,
      filename: 'Mathematics Final Notes.docx',
      file_url: '#',
      file_size: 2.1 * 1024 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // uploaded yesterday!
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      download_count: 32,
      is_pinned: true,
      is_seeded: true
    }
  ];

  const existingFolders = getStorageItem<Folder[]>(FOLDERS_KEY, []);
  const existingFiles = getStorageItem<FileItem[]>(FILES_KEY, []);

  setStorageItem(FOLDERS_KEY, [...existingFolders, ...folders]);
  setStorageItem(FILES_KEY, [...existingFiles, ...files]);

  // Seed default activities
  const activities: ActivityLog[] = [
    {
      id: 'activity-' + generateId(),
      owner_id: userId,
      type: 'upload',
      details: `You uploaded Science Project Presentation.pptx`,
      timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'activity-' + generateId(),
      owner_id: userId,
      type: 'share',
      details: `You shared Board Meeting Deck.pptx`,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'activity-' + generateId(),
      owner_id: userId,
      type: 'download',
      details: `You downloaded Business Plan 2025.pdf`,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  const existingActivities = getStorageItem<ActivityLog[]>(ACTIVITIES_KEY, []);
  setStorageItem(ACTIVITIES_KEY, [...existingActivities, ...activities]);

  // Async push to Firestore
  folders.forEach(f => {
    setDoc(doc(firestore, 'folders', f.id), f).catch(err => {
      console.error("Firestore seed folder failed:", err);
    });
  });
  files.forEach(f => {
    setDoc(doc(firestore, 'files', f.id), f).catch(err => {
      console.error("Firestore seed file failed:", err);
    });
  });
  activities.forEach(a => {
    setDoc(doc(firestore, 'activities', a.id), a).catch(err => {
      console.error("Firestore seed activity failed:", err);
    });
  });

  return { files, folders };
}

/**
 * Authentication Engine
 */
export const dbAuth = {
  getCurrentSession: (): Profile | null => {
    return getStorageItem<Profile | null>(SESSION_KEY, null);
  },

  saveSession: (profile: Profile): void => {
    setStorageItem(SESSION_KEY, profile);
  },

  getProfile: async (userId: string): Promise<Profile | null> => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(firestore, 'profiles', userId));
      if (docSnap.exists()) {
        return docSnap.data() as Profile;
      }
    } catch (err) {
      console.error("Error fetching Google profile from Firestore:", err);
    }
    return null;
  },

  signUpWithGoogle: async (userId: string, email: string, displayName: string): Promise<Profile> => {
    const profiles = getStorageItem<Profile[]>(PROFILES_KEY, []);
    
    // Create a unique, elegant vault name from their email address prefix
    const rawVaultName = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const vaultName = rawVaultName.charAt(0).toUpperCase() + rawVaultName.slice(1);
    
    const newProfile: Profile = {
      id: userId,
      email,
      display_name: displayName,
      vault_name: vaultName,
      created_at: new Date().toISOString(),
      biometrics_enabled: true
    };

    // Save to Firestore
    await setDoc(doc(firestore, 'profiles', userId), newProfile).catch((error) => {
      handleFirestoreError(error, OperationType.CREATE, `profiles/${userId}`);
    });

    // Sync to Supabase
    supabaseSync.upsertProfile(newProfile);

    profiles.push(newProfile);
    setStorageItem(PROFILES_KEY, profiles);

    // Seed beautiful default presentation decks immediately for new account
    seedSampleData(userId, displayName);

    return newProfile;
  },

  signUp: async (email: string, displayName: string, vaultName: string, passcode: string): Promise<Profile> => {
    const profiles = getStorageItem<(Profile & { passcode?: string })[]>(PROFILES_KEY, []);
    
    // Check if vault or email exists
    const normalizedVault = vaultName.trim().toLowerCase();
    const existing = profiles.find(p => p.email === email || p.vault_name.toLowerCase() === normalizedVault);
    if (existing) {
      throw new Error("Email or Vault Name already exists. Vault names must be unique.");
    }

    const encryptedPasscode = await encryptData(passcode, 'pumanocan-vault-passcode-key');

    const newProfile: Profile = {
      id: generateId(),
      email,
      display_name: displayName,
      vault_name: vaultName,
      created_at: new Date().toISOString(),
      passcode: encryptedPasscode,
      biometrics_enabled: true
    };

    // Save to Firestore
    await setDoc(doc(firestore, 'profiles', newProfile.id), newProfile).catch((error) => {
      handleFirestoreError(error, OperationType.CREATE, `profiles/${newProfile.id}`);
    });

    // Sync to Supabase
    supabaseSync.upsertProfile(newProfile);

    profiles.push(newProfile);
    setStorageItem(PROFILES_KEY, profiles);

    // Auto session setting
    setStorageItem(SESSION_KEY, newProfile);

    // Seed beautiful high-fidelity dashboard records immediately
    seedSampleData(newProfile.id, displayName);

    return newProfile;
  },

  signIn: async (vaultOrEmail: string, passcode: string): Promise<Profile> => {
    let profiles = getStorageItem<(Profile & { passcode?: string })[]>(PROFILES_KEY, []);
    let user = profiles.find(
      p => p.email.toLowerCase() === vaultOrEmail.toLowerCase() || 
           p.vault_name.toLowerCase() === vaultOrEmail.toLowerCase()
    );

    // Pull from Firestore if not cached locally
    if (!user) {
      try {
        const q = query(collection(firestore, 'profiles'), where('email', '==', vaultOrEmail.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          user = querySnapshot.docs[0].data() as Profile;
          profiles.push(user);
          setStorageItem(PROFILES_KEY, profiles);
        } else {
          const q2 = query(collection(firestore, 'profiles'), where('vault_name', '==', vaultOrEmail));
          const querySnapshot2 = await getDocs(q2);
          if (!querySnapshot2.empty) {
            user = querySnapshot2.docs[0].data() as Profile;
            profiles.push(user);
            setStorageItem(PROFILES_KEY, profiles);
          }
        }
      } catch (err) {
        console.error("Firestore profile check failed:", err);
      }
    }

    if (!user) {
      throw new Error("Vault Name or Email not found.");
    }

    if (!user.passcode) {
      throw new Error("No passcode is configured for this Vault. Register first.");
    }

    try {
      const decrypted = await decryptData(user.passcode, 'pumanocan-vault-passcode-key');
      if (decrypted !== passcode) {
        throw new Error("Incorrect passcode. Access denied.");
      }
    } catch {
      throw new Error("Authentication failed. Invalid credentials.");
    }

    setStorageItem(SESSION_KEY, user);
    return user;
  },

  signInBiometric: async (vaultName: string): Promise<Profile> => {
    let profiles = getStorageItem<Profile[]>(PROFILES_KEY, []);
    let user = profiles.find(p => p.vault_name.toLowerCase() === vaultName.toLowerCase());
    
    // Pull from Firestore if not cached locally
    if (!user) {
      try {
        const q = query(collection(firestore, 'profiles'), where('vault_name', '==', vaultName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          user = querySnapshot.docs[0].data() as Profile;
          profiles.push(user);
          setStorageItem(PROFILES_KEY, profiles);
        }
      } catch (err) {
        console.error("Firestore biometric profile fetch failed:", err);
      }
    }

    if (!user) {
      throw new Error(`Vault "${vaultName}" not found.`);
    }

    setStorageItem(SESSION_KEY, user);
    return user;
  },

  signOut: (): void => {
    localStorage.removeItem(SESSION_KEY);
  }
};

/**
 * Files Database Engine
 */
export const dbFiles = {
  getFiles: (userId: string): FileItem[] => {
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    return files.filter(f => f.owner_id === userId);
  },

  syncFromFirestore: async (userId: string): Promise<void> => {
    try {
      const q = query(collection(firestore, 'files'), where('owner_id', '==', userId));
      const querySnapshot = await getDocs(q);
      const files: FileItem[] = [];
      querySnapshot.forEach((doc) => {
        files.push(doc.data() as FileItem);
      });
      const allFiles = getStorageItem<FileItem[]>(FILES_KEY, []);
      const remaining = allFiles.filter(f => f.owner_id !== userId);
      
      const merged = [...remaining];
      const localMap = new Map(remaining.map(f => [f.id, f]));
      files.forEach(f => {
        if (!localMap.has(f.id)) {
          merged.push(f);
        } else {
          const idx = merged.findIndex(item => item.id === f.id);
          if (idx !== -1) merged[idx] = f;
        }
      });
      setStorageItem(FILES_KEY, merged);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'files');
    }
  },

  uploadFile: (userId: string, filename: string, size: number, mimeType: string, folderId: string | null = null, customUrl?: string): FileItem => {
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    
    const newFile: FileItem = {
      id: 'file-' + generateId(),
      owner_id: userId,
      folder_id: folderId,
      filename,
      file_url: customUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
      file_size: size,
      mime_type: mimeType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      download_count: 0
    };

    // Save locally
    files.push(newFile);
    setStorageItem(FILES_KEY, files);

    // Save to Firestore
    setDoc(doc(firestore, 'files', newFile.id), newFile).catch((error) => {
      handleFirestoreError(error, OperationType.CREATE, `files/${newFile.id}`);
    });

    // Sync to Supabase
    supabaseSync.upsertFile(newFile);

    // Add activity log
    dbActivities.addLog(userId, 'upload', `You uploaded ${filename}`);
    
    return newFile;
  },

  renameFile: (userId: string, fileId: string, newName: string): FileItem => {
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    const index = files.findIndex(f => f.id === fileId && f.owner_id === userId);
    
    if (index === -1) throw new Error("File not found or unauthorized.");
    
    const oldName = files[index].filename;
    files[index].filename = newName;
    files[index].updated_at = new Date().toISOString();
    
    setStorageItem(FILES_KEY, files);

    // Update in Firestore
    setDoc(doc(firestore, 'files', fileId), files[index]).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `files/${fileId}`);
    });

    // Sync to Supabase
    supabaseSync.upsertFile(files[index]);

    dbActivities.addLog(userId, 'share', `You renamed file "${oldName}" to "${newName}"`);
    
    return files[index];
  },

  deleteFile: (userId: string, fileId: string): void => {
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    const index = files.findIndex(f => f.id === fileId && f.owner_id === userId);
    
    if (index === -1) throw new Error("File not found.");

    if (files[index].is_deleted) {
      // Permanent delete
      const filtered = files.filter(f => !(f.id === fileId && f.owner_id === userId));
      setStorageItem(FILES_KEY, filtered);

      // Delete from Firestore
      deleteDoc(doc(firestore, 'files', fileId)).catch((error) => {
        handleFirestoreError(error, OperationType.DELETE, `files/${fileId}`);
      });

      // Sync to Supabase
      supabaseSync.deleteFile(fileId);

      dbActivities.addLog(userId, 'delete', `Permanently deleted file ${files[index].filename}`);
    } else {
      files[index].is_deleted = true;
      files[index].updated_at = new Date().toISOString();
      setStorageItem(FILES_KEY, files);

      // Update in Firestore
      setDoc(doc(firestore, 'files', fileId), files[index]).catch((error) => {
        handleFirestoreError(error, OperationType.UPDATE, `files/${fileId}`);
      });

      // Sync to Supabase
      supabaseSync.upsertFile(files[index]);

      dbActivities.addLog(userId, 'delete', `Moved file ${files[index].filename} to Trash`);
    }
  },

  restoreFile: (userId: string, fileId: string): void => {
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    const index = files.findIndex(f => f.id === fileId && f.owner_id === userId);
    
    if (index === -1) throw new Error("File not found.");

    files[index].is_deleted = false;
    files[index].updated_at = new Date().toISOString();
    
    setStorageItem(FILES_KEY, files);

    // Update in Firestore
    setDoc(doc(firestore, 'files', fileId), files[index]).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `files/${fileId}`);
    });

    // Sync to Supabase
    supabaseSync.upsertFile(files[index]);

    dbActivities.addLog(userId, 'upload', `Restored file ${files[index].filename} from Trash`);
  },

  togglePinFile: (userId: string, fileId: string): FileItem => {
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    const index = files.findIndex(f => f.id === fileId && f.owner_id === userId);
    if (index === -1) throw new Error("File not found.");

    files[index].is_pinned = !files[index].is_pinned;
    setStorageItem(FILES_KEY, files);

    // Update in Firestore
    setDoc(doc(firestore, 'files', fileId), files[index]).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `files/${fileId}`);
    });

    // Sync to Supabase
    supabaseSync.upsertFile(files[index]);

    return files[index];
  },

  toggleFavoriteFile: (userId: string, fileId: string): FileItem => {
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    const index = files.findIndex(f => f.id === fileId && f.owner_id === userId);
    if (index === -1) throw new Error("File not found.");

    files[index].is_favorite = !files[index].is_favorite;
    setStorageItem(FILES_KEY, files);

    // Update in Firestore
    setDoc(doc(firestore, 'files', fileId), files[index]).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `files/${fileId}`);
    });

    // Sync to Supabase
    supabaseSync.upsertFile(files[index]);

    dbActivities.addLog(userId, 'favorite', `Toggled favorite for file ${files[index].filename}`);
    return files[index];
  },

  moveFile: (userId: string, fileId: string, folderId: string | null): FileItem => {
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    const index = files.findIndex(f => f.id === fileId && f.owner_id === userId);
    if (index === -1) throw new Error("File not found.");

    files[index].folder_id = folderId;
    files[index].updated_at = new Date().toISOString();
    setStorageItem(FILES_KEY, files);

    // Update in Firestore
    setDoc(doc(firestore, 'files', fileId), files[index]).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `files/${fileId}`);
    });

    // Sync to Supabase
    supabaseSync.upsertFile(files[index]);

    const folderName = folderId ? "another folder" : "root directory";
    dbActivities.addLog(userId, 'share', `Moved file ${files[index].filename} to ${folderName}`);
    return files[index];
  },

  uploadFileReal: async (
    userId: string,
    file: File | Blob,
    filename: string,
    folderId: string | null = null,
    onProgress?: (progress: number) => void
  ): Promise<FileItem> => {
    if (!userId) {
      throw new Error("Authentication session is required to upload files.");
    }

    const fileId = 'file-' + generateId();
    let cloudUrl = '';

    // 1. Handle duplicate filenames correctly
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    let resolvedFilename = filename;
    let extension = '';
    let nameWithoutExt = filename;
    
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      nameWithoutExt = filename.substring(0, lastDotIndex);
      extension = filename.substring(lastDotIndex);
    }
    
    let counter = 1;
    while (files.some(f => f.owner_id === userId && f.folder_id === folderId && f.filename === resolvedFilename)) {
      resolvedFilename = `${nameWithoutExt} (${counter})${extension}`;
      counter++;
    }

    // 2. Isolate path inside storage: user_id/folder_name/file.ext
    let folderName = 'root';
    if (folderId) {
      const folders = getStorageItem<Folder[]>(FOLDERS_KEY, []);
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        folderName = folder.folder_name;
      }
    }
    const cleanFolderName = folderName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'folder';
    const storagePath = `${userId}/${cleanFolderName}/${resolvedFilename}`;

    const { url: supabaseUrl, anonKey, enabled: supabaseEnabled } = getSupabaseConfig();
    const supabaseClient = getSupabaseClient();

    // Helper to upload to file.io with progress tracking using XMLHttpRequest
    const uploadToFileIoWithProgress = (
      f: File | Blob, 
      fname: string, 
      progressCallback?: (progress: number) => void
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://file.io/', true);
        
        if (progressCallback) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              progressCallback(percentComplete);
            }
          };
        }
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText);
              if (json.success && json.link) {
                resolve(json.link);
              } else {
                reject(new Error('Invalid response format from file.io'));
              }
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Server returned status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error during fallback upload'));
        
        const formData = new FormData();
        formData.append('file', f, fname);
        xhr.send(formData);
      });
    };

    // Helper to upload to tmpfiles.org with progress tracking using XMLHttpRequest
    const uploadToTmpfilesWithProgress = (
      f: File | Blob, 
      fname: string, 
      progressCallback?: (progress: number) => void
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://tmpfiles.org/api/v1/upload', true);
        
        if (progressCallback) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              progressCallback(percentComplete);
            }
          };
        }
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText);
              if (json.status === 'success' && json.data && json.data.url) {
                const directUrl = json.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
                resolve(directUrl);
              } else {
                reject(new Error('Invalid response format from tmpfiles.org'));
              }
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Server returned status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error during tmpfiles fallback upload'));
        
        const formData = new FormData();
        formData.append('file', f, fname);
        xhr.send(formData);
      });
    };

    // Helper to upload to Supabase Storage with XMLHttpRequest for progress tracking
    const uploadToSupabaseWithProgress = (
      f: File | Blob,
      path: string,
      sUrl: string,
      sKey: string,
      progressCallback?: (progress: number) => void
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const uploadUrl = `${sUrl}/storage/v1/object/pumanocan-vault/${encodeURIComponent(path)}`;
        
        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${sKey}`);
        xhr.setRequestHeader('apikey', sKey);
        xhr.setRequestHeader('x-upsert', 'true');
        
        if (progressCallback) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              progressCallback(percentComplete);
            }
          };
        }
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const publicUrl = `${sUrl}/storage/v1/object/public/pumanocan-vault/${encodeURIComponent(path)}`;
            resolve(publicUrl);
          } else {
            reject(new Error(`Supabase REST upload returned status ${xhr.status}: ${xhr.responseText}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error during Supabase REST upload'));
        xhr.send(f);
      });
    };

    // Tier 1: Try Supabase if enabled
    if (supabaseEnabled && supabaseClient && supabaseUrl && anonKey) {
      try {
        console.log(`Starting Supabase upload to bucket: pumanocan-vault at path: ${storagePath}`);
        
        // Ensure bucket exists
        try {
          const { data: buckets } = await supabaseClient.storage.listBuckets();
          const bucketExists = buckets?.some(b => b.name === 'pumanocan-vault');
          if (!bucketExists) {
            console.log("Bucket pumanocan-vault does not exist, creating...");
            await supabaseClient.storage.createBucket('pumanocan-vault', {
              public: true,
              fileSizeLimit: 104857600 // 100MB
            });
          }
        } catch (bErr) {
          console.warn("Could not list or create bucket, attempting upload anyway:", bErr);
        }

        // Try XHR first for progress
        try {
          cloudUrl = await uploadToSupabaseWithProgress(file, storagePath, supabaseUrl, anonKey, onProgress);
          console.log("Supabase REST upload succeeded. Public URL:", cloudUrl);
        } catch (xhrErr) {
          console.warn("Supabase REST upload failed, falling back to official SDK upload method:", xhrErr);
          // Fallback to official SDK
          const { error: uploadError } = await supabaseClient.storage
            .from('pumanocan-vault')
            .upload(storagePath, file, { upsert: true });
            
          if (uploadError) throw uploadError;
          
          const { data } = supabaseClient.storage.from('pumanocan-vault').getPublicUrl(storagePath);
          cloudUrl = data.publicUrl;
          if (onProgress) onProgress(100);
          console.log("Supabase SDK upload succeeded. Public URL:", cloudUrl);
        }
      } catch (err: any) {
        console.warn("All Supabase upload attempts failed, falling back to other tiers:", err);
      }
    }

    // Tier 2: Try Firebase Storage
    if (!cloudUrl) {
      try {
        console.log("Attempting Firebase Storage upload...");
        const fileRef = ref(storage, `users/${userId}/files/${fileId}/${resolvedFilename}`);
        const uploadTask = uploadBytesResumable(fileRef, file);
        
        cloudUrl = await new Promise<string>((resolve, reject) => {
          // Add a 10-second timeout to prevent getting frozen indefinitely
          const timeoutId = setTimeout(() => {
            console.warn("Firebase Storage upload timed out after 10s, triggering fallback.");
            uploadTask.cancel();
            reject(new Error("Firebase Storage upload timed out."));
          }, 10000);

          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              if (onProgress) onProgress(progress);
            },
            (err) => {
              clearTimeout(timeoutId);
              reject(err);
            },
            async () => {
              clearTimeout(timeoutId);
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (urlErr) {
                reject(urlErr);
              }
            }
          );
        });
        console.log("Firebase Storage upload succeeded:", cloudUrl);
      } catch (err) {
        console.warn("Firebase Storage upload failed or timed out, trying file.io cloud storage fallback:", err);
      }
    }

    // Tier 3: Try file.io fallback & tmpfiles.org fallback
    if (!cloudUrl) {
      try {
        console.log("Attempting file.io fallback upload...");
        cloudUrl = await uploadToFileIoWithProgress(file, resolvedFilename, onProgress);
        console.log("file.io fallback upload succeeded:", cloudUrl);
      } catch (fallbackErr) {
        console.warn("file.io cloud storage fallback failed, trying tmpfiles.org fallback...");
        try {
          cloudUrl = await uploadToTmpfilesWithProgress(file, resolvedFilename, onProgress);
          console.log("tmpfiles.org fallback upload succeeded:", cloudUrl);
        } catch (tmpfilesErr) {
          console.warn("All cloud storage fallback uploads failed, using local Object URL fallback:", tmpfilesErr);
        }
      }
    }

    // Tier 4: Local URL fallback (file remains viewable/downloadable in the active browser session)
    if (!cloudUrl) {
      cloudUrl = URL.createObjectURL(file);
      if (onProgress) onProgress(100);
      console.log("Local URL fallback used:", cloudUrl);
    }

    const newFile: FileItem = {
      id: fileId,
      owner_id: userId,
      folder_id: folderId,
      filename: resolvedFilename,
      file_url: cloudUrl,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      download_count: 0
    };

    // Save metadata securely in Firestore
    await setDoc(doc(firestore, 'files', fileId), newFile).catch((error) => {
      handleFirestoreError(error, OperationType.CREATE, `files/${fileId}`);
    });

    // Save file metadata locally
    const updatedFiles = getStorageItem<FileItem[]>(FILES_KEY, []);
    updatedFiles.push(newFile);
    setStorageItem(FILES_KEY, updatedFiles);

    // Sync to Supabase
    supabaseSync.upsertFile(newFile);

    // Log activity
    dbActivities.addLog(userId, 'upload', `You uploaded ${resolvedFilename}`);

    return newFile;
  }
};

/**
 * Folders Database Engine
 */
export const dbFolders = {
  getFolders: (userId: string): Folder[] => {
    const folders = getStorageItem<Folder[]>(FOLDERS_KEY, []);
    return folders.filter(f => f.owner_id === userId);
  },

  syncFromFirestore: async (userId: string): Promise<void> => {
    try {
      const q = query(collection(firestore, 'folders'), where('owner_id', '==', userId));
      const querySnapshot = await getDocs(q);
      const folders: Folder[] = [];
      querySnapshot.forEach((doc) => {
        folders.push(doc.data() as Folder);
      });
      const allFolders = getStorageItem<Folder[]>(FOLDERS_KEY, []);
      const remaining = allFolders.filter(f => f.owner_id !== userId);
      
      const merged = [...remaining];
      const localMap = new Map(remaining.map(f => [f.id, f]));
      folders.forEach(f => {
        if (!localMap.has(f.id)) {
          merged.push(f);
        } else {
          const idx = merged.findIndex(item => item.id === f.id);
          if (idx !== -1) merged[idx] = f;
        }
      });
      setStorageItem(FOLDERS_KEY, merged);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'folders');
    }
  },

  createFolder: (userId: string, folderName: string, parentId?: string): Folder => {
    const folders = getStorageItem<Folder[]>(FOLDERS_KEY, []);
    
    const newFolder: Folder = {
      id: 'folder-' + generateId(),
      owner_id: userId,
      folder_name: folderName,
      parent_id: parentId || '',
      created_at: new Date().toISOString()
    };

    // Save locally
    folders.push(newFolder);
    setStorageItem(FOLDERS_KEY, folders);

    // Sync to Supabase
    supabaseSync.upsertFolder(newFolder);

    // Save to Firestore
    setDoc(doc(firestore, 'folders', newFolder.id), newFolder).catch((error) => {
      handleFirestoreError(error, OperationType.CREATE, `folders/${newFolder.id}`);
    });

    dbActivities.addLog(userId, 'create_folder', `Created folder "${folderName}"`);
    return newFolder;
  },

  renameFolder: (userId: string, folderId: string, newName: string): Folder => {
    const folders = getStorageItem<Folder[]>(FOLDERS_KEY, []);
    const index = folders.findIndex(f => f.id === folderId && f.owner_id === userId);
    if (index === -1) throw new Error("Folder not found.");

    const oldName = folders[index].folder_name;
    folders[index].folder_name = newName;
    setStorageItem(FOLDERS_KEY, folders);

    // Update in Firestore
    setDoc(doc(firestore, 'folders', folderId), folders[index]).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `folders/${folderId}`);
    });

    // Sync to Supabase
    supabaseSync.upsertFolder(folders[index]);

    dbActivities.addLog(userId, 'share', `Renamed folder "${oldName}" to "${newName}"`);
    return folders[index];
  },

  deleteFolder: (userId: string, folderId: string): void => {
    // Delete folder locally
    const folders = getStorageItem<Folder[]>(FOLDERS_KEY, []);
    const filteredFolders = folders.filter(f => !(f.id === folderId && f.owner_id === userId));
    setStorageItem(FOLDERS_KEY, filteredFolders);

    // Delete folder from Firestore
    deleteDoc(doc(firestore, 'folders', folderId)).catch((error) => {
      handleFirestoreError(error, OperationType.DELETE, `folders/${folderId}`);
    });

    // Sync to Supabase
    supabaseSync.deleteFolder(folderId);

    // Move any files in this folder to Root instead of deleting them outright
    const files = getStorageItem<FileItem[]>(FILES_KEY, []);
    const updatedFiles = files.map(f => {
      if (f.folder_id === folderId && f.owner_id === userId) {
        const updated = { ...f, folder_id: null };
        setDoc(doc(firestore, 'files', f.id), updated).catch((error) => {
          handleFirestoreError(error, OperationType.UPDATE, `files/${f.id}`);
        });
        // Sync updated file to Supabase
        supabaseSync.upsertFile(updated);
        return updated;
      }
      return f;
    });
    setStorageItem(FILES_KEY, updatedFiles);

    dbActivities.addLog(userId, 'delete', `Deleted folder`);
  },

  togglePinFolder: (userId: string, folderId: string): Folder => {
    const folders = getStorageItem<Folder[]>(FOLDERS_KEY, []);
    const index = folders.findIndex(f => f.id === folderId && f.owner_id === userId);
    if (index === -1) throw new Error("Folder not found.");

    folders[index].is_pinned = !folders[index].is_pinned;
    setStorageItem(FOLDERS_KEY, folders);

    // Update in Firestore
    setDoc(doc(firestore, 'folders', folderId), folders[index]).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `folders/${folderId}`);
    });

    // Sync to Supabase
    supabaseSync.upsertFolder(folders[index]);

    return folders[index];
  },

  toggleFavoriteFolder: (userId: string, folderId: string): Folder => {
    const folders = getStorageItem<Folder[]>(FOLDERS_KEY, []);
    const index = folders.findIndex(f => f.id === folderId && f.owner_id === userId);
    if (index === -1) throw new Error("Folder not found.");

    folders[index].is_favorite = !folders[index].is_favorite;
    setStorageItem(FOLDERS_KEY, folders);

    // Update in Firestore
    setDoc(doc(firestore, 'folders', folderId), folders[index]).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `folders/${folderId}`);
    });

    // Sync to Supabase
    supabaseSync.upsertFolder(folders[index]);

    return folders[index];
  }
};

/**
 * Activity Log Engine
 */
export const dbActivities = {
  getLogs: (userId: string): ActivityLog[] => {
    const logs = getStorageItem<ActivityLog[]>(ACTIVITIES_KEY, []);
    return logs.filter(l => l.owner_id === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  syncFromFirestore: async (userId: string): Promise<void> => {
    try {
      const q = query(collection(firestore, 'activities'), where('owner_id', '==', userId));
      const querySnapshot = await getDocs(q);
      const activities: ActivityLog[] = [];
      querySnapshot.forEach((doc) => {
        activities.push(doc.data() as ActivityLog);
      });
      const allActivities = getStorageItem<ActivityLog[]>(ACTIVITIES_KEY, []);
      const remaining = allActivities.filter(a => a.owner_id !== userId);
      
      const merged = [...remaining];
      const localMap = new Map(remaining.map(a => [a.id, a]));
      activities.forEach(a => {
        if (!localMap.has(a.id)) {
          merged.push(a);
        } else {
          const idx = merged.findIndex(item => item.id === a.id);
          if (idx !== -1) merged[idx] = a;
        }
      });
      setStorageItem(ACTIVITIES_KEY, merged);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'activities');
    }
  },

  addLog: (userId: string, type: ActivityLog['type'], details: string): ActivityLog => {
    const logs = getStorageItem<ActivityLog[]>(ACTIVITIES_KEY, []);
    
    const newLog: ActivityLog = {
      id: 'activity-' + generateId(),
      owner_id: userId,
      type,
      details,
      timestamp: new Date().toISOString()
    };

    // Save locally
    logs.push(newLog);
    setStorageItem(ACTIVITIES_KEY, logs);

    // Save to Firestore
    setDoc(doc(firestore, 'activities', newLog.id), newLog).catch((error) => {
      handleFirestoreError(error, OperationType.CREATE, `activities/${newLog.id}`);
    });

    // Sync to Supabase
    supabaseSync.insertActivity(newLog);

    return newLog;
  }
};

/**
 * Settings Engine
 */
export const dbSettings = {
  getSettings: (): AppSettings => {
    return getStorageItem<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  },

  saveSettings: (settings: AppSettings): void => {
    setStorageItem(SETTINGS_KEY, settings);
  }
};
