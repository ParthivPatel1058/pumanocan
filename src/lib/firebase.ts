import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const storage = getStorage(app);

// Configure Google Auth Provider with requested Workspace Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/presentations.readonly');

// In-memory caching of the access token for security
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Handle Google authentication popup flow using direct OAuth implicit flow
 * and Firebase credential sign-in to bypass unauthorized-domain issues.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;

    const clientId = (firebaseConfig as any).oAuthClientId || "885440242777-cqqa0h84nkqu1agesmmbl4dt3uueapb5.apps.googleusercontent.com";
    const redirectUri = window.location.origin;
    const scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/presentations.readonly'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&prompt=select_account`;

    const token = await new Promise<string>((resolve, reject) => {
      const popup = window.open(authUrl, 'google_oauth_popup', 'width=600,height=700');
      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site to connect Google Workspace.'));
        return;
      }

      // Check if popup was closed by user
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Sign-in popup was closed before completing authorization.'));
        }
      }, 1000);

      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_OAUTH_TOKEN_SUCCESS' && event.data?.token) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          resolve(event.data.token);
        }
      };

      window.addEventListener('message', messageListener);
    });

    // Authenticate with Firebase Auth using the Google access token
    const credential = GoogleAuthProvider.credential(null, token);
    const result = await signInWithCredential(auth, credential);
    
    cachedAccessToken = token;
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve the cached in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Log out from Firebase Authentication
 */
export const logoutFirebase = async (): Promise<void> => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
};

/**
 * Initialize and listen to Auth state changes
 */
export const initAuthListener = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Clear if not explicitly logging in
        cachedAccessToken = null;
        onFailure();
      }
    } else {
      cachedAccessToken = null;
      onFailure();
    }
  });
};
