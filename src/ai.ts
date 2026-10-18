import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from 'firebase/ai';

import { app } from './firebase';
export { db } from './firebase';

const ai = getAI(app, {
  backend: new GoogleAIBackend(),
});

const model = getGenerativeModel(ai, {
  model: import.meta.env.VITE_FIREBASE_AI_MODEL || 'gemini-3.8-flash',
  generationConfig: { temperature: 0 },
});

export async function askAI(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text();
}
