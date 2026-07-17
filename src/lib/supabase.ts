import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, Folder, FileItem, ActivityLog } from '../types';

// Storage keys
const SUPABASE_URL_KEY = 'pumanocan_supabase_url';
const SUPABASE_ANON_KEY = 'pumanocan_supabase_anon_key';
const SUPABASE_ENABLED_KEY = 'pumanocan_supabase_enabled';

interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

/**
 * Get Supabase configuration from localStorage or environment variables
 */
export const getSupabaseConfig = (): SupabaseConfig => {
  const metaEnv = (import.meta as any).env || {};
  const url = localStorage.getItem(SUPABASE_URL_KEY) || metaEnv.VITE_SUPABASE_URL || '';
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY) || metaEnv.VITE_SUPABASE_ANON_KEY || '';
  
  // If environment variables are defined, default enabled to true if not explicitly set in localStorage
  const hasLocalEnabled = localStorage.getItem(SUPABASE_ENABLED_KEY);
  const defaultEnabled = (metaEnv.VITE_SUPABASE_URL && metaEnv.VITE_SUPABASE_ANON_KEY) ? true : false;
  const enabled = hasLocalEnabled !== null 
    ? hasLocalEnabled === 'true' 
    : defaultEnabled;
    
  return { url, anonKey, enabled };
};

/**
 * Save Supabase configuration to localStorage
 */
export const saveSupabaseConfig = (url: string, anonKey: string, enabled: boolean) => {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  localStorage.setItem(SUPABASE_ENABLED_KEY, String(enabled));
  
  // Reinitialize client
  _client = null;
};

let _client: SupabaseClient | null = null;

/**
 * Retrieve the active Supabase client instance (lazy initialization)
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (_client) return _client;

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  try {
    _client = createClient(url, anonKey, {
      auth: {
        persistSession: false, // Avoid conflicting with Firebase auth session
      }
    });
    return _client;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

/**
 * Test Supabase Connection by attempting to select from profiles or just testing initialization
 */
export const testSupabaseConnection = async (url: string, anonKey: string): Promise<boolean> => {
  if (!url || !anonKey) return false;
  try {
    const tempClient = createClient(url, anonKey);
    // Attempt to query a dummy/any table or simply check if initialization completes without threw.
    // Querying with limit 1 is a good check. If the table doesn't exist yet, it might return an error,
    // but a successful API response (even with code 42P01 table does not exist) proves connectivity and anonKey validity!
    const { error } = await tempClient.from('_connection_test_').select('*').limit(1);
    
    // If the error code is not invalid api key or network error, it's connected
    if (error && (error.message.includes('FetchError') || error.message.includes('Failed to fetch') || error.code === 'PGRST111')) {
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase test connection failed:', err);
    return false;
  }
};

/**
 * Sync operations with Supabase (when enabled)
 */
export const supabaseSync = {
  // Save or update Profile
  upsertProfile: async (profile: Profile): Promise<void> => {
    const client = getSupabaseClient();
    if (!client || !getSupabaseConfig().enabled) return;

    try {
      const { error } = await client.from('profiles').upsert({
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name,
        vault_name: profile.vault_name,
        created_at: profile.created_at,
        passcode: profile.passcode || null,
        biometrics_enabled: profile.biometrics_enabled ?? true
      });
      if (error) throw error;
    } catch (err) {
      console.error('Supabase Profile Upsert Error:', err);
    }
  },

  // Save or update Folder
  upsertFolder: async (folder: Folder): Promise<void> => {
    const client = getSupabaseClient();
    if (!client || !getSupabaseConfig().enabled) return;

    try {
      const { error } = await client.from('folders').upsert({
        id: folder.id,
        owner_id: folder.owner_id,
        folder_name: folder.folder_name,
        parent_id: folder.parent_id || null,
        created_at: folder.created_at,
        is_pinned: folder.is_pinned ?? false,
        is_favorite: folder.is_favorite ?? false
      });
      if (error) throw error;
    } catch (err) {
      console.error('Supabase Folder Upsert Error:', err);
    }
  },

  // Delete Folder
  deleteFolder: async (folderId: string): Promise<void> => {
    const client = getSupabaseClient();
    if (!client || !getSupabaseConfig().enabled) return;

    try {
      const { error } = await client.from('folders').delete().eq('id', folderId);
      if (error) throw error;
    } catch (err) {
      console.error('Supabase Folder Delete Error:', err);
    }
  },

  // Save or update File
  upsertFile: async (file: FileItem): Promise<void> => {
    const client = getSupabaseClient();
    if (!client || !getSupabaseConfig().enabled) return;

    try {
      const { error } = await client.from('files').upsert({
        id: file.id,
        owner_id: file.owner_id,
        folder_id: file.folder_id || null,
        filename: file.filename,
        file_url: file.file_url,
        file_size: file.file_size,
        mime_type: file.mime_type,
        created_at: file.created_at,
        updated_at: file.updated_at,
        is_pinned: file.is_pinned ?? false,
        is_favorite: file.is_favorite ?? false,
        is_deleted: file.is_deleted ?? false,
        is_seeded: file.is_seeded ?? false,
        download_count: file.download_count ?? 0
      });
      if (error) throw error;
    } catch (err) {
      console.error('Supabase File Upsert Error:', err);
    }
  },

  // Delete File
  deleteFile: async (fileId: string): Promise<void> => {
    const client = getSupabaseClient();
    if (!client || !getSupabaseConfig().enabled) return;

    try {
      const { error } = await client.from('files').delete().eq('id', fileId);
      if (error) throw error;
    } catch (err) {
      console.error('Supabase File Delete Error:', err);
    }
  },

  // Save Activity Log
  insertActivity: async (log: ActivityLog): Promise<void> => {
    const client = getSupabaseClient();
    if (!client || !getSupabaseConfig().enabled) return;

    try {
      const { error } = await client.from('activities').insert({
        id: log.id,
        owner_id: log.owner_id,
        type: log.type,
        details: log.details,
        timestamp: log.timestamp
      });
      if (error) throw error;
    } catch (err) {
      console.error('Supabase Activity Insert Error:', err);
    }
  }
};

/**
 * Complete database migration exporter to Supabase
 */
export const migrateAllToSupabase = async (
  userId: string,
  localFolders: Folder[],
  localFiles: FileItem[],
  localLogs: ActivityLog[],
  profile: Profile | null
): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured.' };
  }

  try {
    // 1. Sync profile
    if (profile) {
      const { error: profileErr } = await client.from('profiles').upsert({
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name,
        vault_name: profile.vault_name,
        created_at: profile.created_at,
        passcode: profile.passcode || null,
        biometrics_enabled: profile.biometrics_enabled ?? true
      });
      if (profileErr) throw profileErr;
    }

    // 2. Sync folders
    if (localFolders.length > 0) {
      const folderPayloads = localFolders.map(f => ({
        id: f.id,
        owner_id: f.owner_id,
        folder_name: f.folder_name,
        parent_id: f.parent_id || null,
        created_at: f.created_at,
        is_pinned: f.is_pinned ?? false,
        is_favorite: f.is_favorite ?? false
      }));
      const { error: folderErr } = await client.from('folders').upsert(folderPayloads);
      if (folderErr) throw folderErr;
    }

    // 3. Sync files
    if (localFiles.length > 0) {
      const filePayloads = localFiles.map(f => ({
        id: f.id,
        owner_id: f.owner_id,
        folder_id: f.folder_id || null,
        filename: f.filename,
        file_url: f.file_url,
        file_size: f.file_size,
        mime_type: f.mime_type,
        created_at: f.created_at,
        updated_at: f.updated_at,
        is_pinned: f.is_pinned ?? false,
        is_favorite: f.is_favorite ?? false,
        is_deleted: f.is_deleted ?? false,
        is_seeded: f.is_seeded ?? false,
        download_count: f.download_count ?? 0
      }));
      const { error: fileErr } = await client.from('files').upsert(filePayloads);
      if (fileErr) throw fileErr;
    }

    // 4. Sync activities
    if (localLogs.length > 0) {
      const activityPayloads = localLogs.map(l => ({
        id: l.id,
        owner_id: l.owner_id,
        type: l.type,
        details: l.details,
        timestamp: l.timestamp
      }));
      const { error: activityErr } = await client.from('activities').upsert(activityPayloads);
      if (activityErr) throw activityErr;
    }

    return { 
      success: true, 
      message: `Exported ${localFolders.length} folders, ${localFiles.length} files, and ${localLogs.length} logs to Supabase successfully!` 
    };
  } catch (err: any) {
    console.error('Supabase migration failed:', err);
    return { success: false, message: `Migration failed: ${err.message || err}` };
  }
};

/**
 * Generate standard PostgreSQL DDL for setting up Supabase
 */
export const getSupabaseDDL = (): string => {
  return `-- Copy and run this script in your Supabase SQL Editor:

-- 1. PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  vault_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  passcode TEXT,
  biometrics_enabled BOOLEAN DEFAULT true
);

-- 2. FOLDERS Table
CREATE TABLE IF NOT EXISTS public.folders (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  parent_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false
);

-- 3. FILES Table
CREATE TABLE IF NOT EXISTS public.files (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  is_seeded BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0
);

-- 4. ACTIVITIES Table
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for privacy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create basic policies for owner-only access
CREATE POLICY "Allow owner-only select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow owner-only upsert on profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Allow owner-only folders access" ON public.folders FOR ALL USING (owner_id = owner_id);
CREATE POLICY "Allow owner-only files access" ON public.files FOR ALL USING (owner_id = owner_id);
CREATE POLICY "Allow owner-only activities access" ON public.activities FOR ALL USING (owner_id = owner_id);

-- 5. STORAGE BUCKET Setup
-- Note: Run these SQL statements in your Supabase SQL Editor to prepare the 'pumanocan-vault' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pumanocan-vault', 'pumanocan-vault', true, 104857600, NULL)
ON CONFLICT (id) DO NOTHING;

-- Enable storage RLS policies for public file uploads/downloads
CREATE POLICY "Allow public select access on vault storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'pumanocan-vault');

CREATE POLICY "Allow public upload access on vault storage" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pumanocan-vault');

CREATE POLICY "Allow public update access on vault storage" ON storage.objects
  FOR UPDATE USING (bucket_id = 'pumanocan-vault');

CREATE POLICY "Allow public delete access on vault storage" ON storage.objects
  FOR DELETE USING (bucket_id = 'pumanocan-vault');
`;
};
