import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const app = initializeApp({
  apiKey: '',
  authDomain: '…',
  projectId: '…'
});
const functions = getFunctions(app, 'us-central1');
if (import.meta.env.DEV) connectFunctionsEmulator(functions, '127.0.0.1', 5002);

export async function submitQuestionnaire(payload) {
  const fn = httpsCallable(functions, 'submitQuestionnaire');
  const { data } = await fn(payload);
  return data; // { category, recommendations }
}
