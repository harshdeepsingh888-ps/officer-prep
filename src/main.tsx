import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import './index.css'
import { isInstalled } from './lib/install' // also captures the install prompt before React mounts
import { protectStorage } from './lib/db'
import { initContent } from './content/store'
import App from './App'

// An installed app gets persistent storage without a prompt in Chrome/Edge — ask once at start.
if (isInstalled()) protectStorage()

// Published content (questions, pictures, notes… from the admin panel): this device's copy is read before the
// first render, then refreshed from the site. A slow database never holds the page back for more than 300 ms.
const ready = Promise.race([initContent(), new Promise(r => setTimeout(r, 300))])

ready.finally(() => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
))
