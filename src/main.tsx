import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase } from './client/auth'
import { initializeNativeApp } from './client/native'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

void initializeNativeApp(supabase).catch(() => window.dispatchEvent(new Event('vantagallu:auth-error')))
