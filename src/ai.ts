import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check';
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from 'firebase/ai';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDmRaso8xpzEKYsU7igWsZRTqj-D01INow",
  authDomain: "intelli-menu-eb62d.firebaseapp.com",
  projectId: "intelli-menu-eb62d",
  storageBucket: "intelli-menu-eb62d.firebasestorage.app",
  messagingSenderId: "1043181665154",
  appId: "1:1043181665154:web:ac33e5074f8f8eb92fad9b",
  measurementId: "G-RT4YH40W36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Permite testarea pe localhost.
if (import.meta.env.DEV) {
  const debugGlobal = globalThis as typeof globalThis & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  };

  debugGlobal.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('6LdZlvMtAAAAAEk7zUgUsu95bA7SOTABlw3REZ1V'),
  isTokenAutoRefreshEnabled: true,
});

const ai = getAI(app, {
  backend: new GoogleAIBackend(),
});

const model = getGenerativeModel(ai, {
  model: 'gemini-3.8-flash',
});

export async function askAI(prompt: string): Promise<string> {
    console.log('asking');
  const result = await model.generateContent(prompt);
  return result.response.text();
}