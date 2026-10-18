import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

export const app = getApps().length ? getApp() : initializeApp({
  apiKey: 'AIzaSyDmRaso8xpzEKYsU7igWsZRTqj-D01INow',
  authDomain: 'intelli-menu-eb62d.firebaseapp.com',
  projectId: 'intelli-menu-eb62d',
  storageBucket: 'intelli-menu-eb62d.firebasestorage.app',
  messagingSenderId: '1043181665154',
  appId: '1:1043181665154:web:ac33e5074f8f8eb92fad9b',
});

// Must be configured BEFORE initializeAppCheck. With true, the Firebase SDK
// generates/persists the local debug token and prints it in the browser console.
if (import.meta.env.DEV) {
  (globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string }).FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
}
const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY || '6LdZlvMtAAAAAEk7zUgUsu95bA7SOTABlw3REZ1V';
initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true });
export const db = getFirestore(app);
