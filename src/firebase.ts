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

// Opt in only when App Check is enforced for this project. A registered, stable
// debug token prevents generating new exchange requests on each page reload.
const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
if (siteKey) {
  if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN) {
    (globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
  }
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true });
}
export const db = getFirestore(app);
