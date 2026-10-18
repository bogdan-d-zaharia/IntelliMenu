import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FirestoreProvider } from './data/FirestoreProvider'

const renderApp = () => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirestoreProvider><App /></FirestoreProvider>
  </StrictMode>,
)

// Startup writes require explicit opt-in; normal startup only loads live data.
const importFirestoreOnStartup = import.meta.env.VITE_FIRESTORE_IMPORT_ON_STARTUP === 'true';
if (import.meta.env.DEV && importFirestoreOnStartup) {
  void import('./migrateFirestore')
    .then(({ migrateFirestoreOnStartup }) => migrateFirestoreOnStartup())
    .catch(error => {
      console.error('Actualizarea Firestore nu a putut porni:', error);
      window.alert('Actualizarea Firestore nu a putut porni. Vezi consola browserului.');
    })
    .finally(renderApp);
} else {
  renderApp();
}
