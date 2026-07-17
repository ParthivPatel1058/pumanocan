export interface Profile {
  id: string;
  email: string;
  display_name: string;
  vault_name: string;
  created_at: string;
  passcode?: string; // Encrypted 4-6 digit passcode for PIN access
  biometrics_enabled?: boolean;
}

export interface Folder {
  id: string;
  owner_id: string;
  folder_name: string;
  parent_id?: string; // For nested folders support!
  created_at: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
}

export interface FileItem {
  id: string;
  owner_id: string;
  folder_id: string | null;
  filename: string;
  file_url: string; // Blob URL or base64 data for genuine downloads!
  file_size: number; // in bytes
  mime_type: string;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
  is_deleted?: boolean;
  is_seeded?: boolean;
  download_count: number;
}

export interface ActivityLog {
  id: string;
  owner_id: string;
  type: 'upload' | 'download' | 'share' | 'favorite' | 'delete' | 'create_folder';
  details: string;
  timestamp: string;
}

export interface AppSettings {
  darkMode: boolean;
  glassIntensity: number; // 0 to 100
  backgroundImage: string;
  language: 'en' | 'es' | 'fr' | 'de';
}
