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

// Finish the additive migration before loading the Firestore-backed screens.
if (import.meta.env.DEV) {
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
