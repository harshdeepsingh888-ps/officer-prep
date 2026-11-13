import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import './landing.css'
import { Logo, PrimaryCta, SecondaryLink, asset } from './parts'

// The branded 404: what happened, and two ways back.

function NotFound() {
  return (
    <main id="main" className="grid min-h-svh place-items-center bg-night px-4 py-24 sm:px-6">
      <div className="max-w-[680px]">
        <Logo className="size-10" />
        <h1 className="mt-8 heading-3 text-white sm:heading-2">This page is off the map</h1>
        <p className="mt-4 body-3 text-mist">The link may be old or mistyped. Your preparation is safe: it lives in the app, on your device.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryCta />
          <SecondaryLink href={asset('')}>Back to the home page</SecondaryLink>
        </div>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><NotFound /></StrictMode>)
