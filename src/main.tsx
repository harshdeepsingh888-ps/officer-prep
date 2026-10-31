import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import { isInstalled } from './lib/install' // also captures the install prompt before React mounts
import { protectStorage } from './lib/db'
import App from './App'

// An installed app gets persistent storage without a prompt in Chrome/Edge — ask once at start.
if (isInstalled()) protectStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
