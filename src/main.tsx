import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FirestoreProvider } from './data/FirestoreProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirestoreProvider><App /></FirestoreProvider>
  </StrictMode>,
)
