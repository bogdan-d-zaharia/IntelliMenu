import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check';
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from 'firebase/ai';

import { app } from './firebase';
export { db } from './firebase';

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
