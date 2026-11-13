import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import './landing.css'
import { ArrowLeftIcon } from '@phosphor-icons/react'
import { DISCLAIMER } from './content'
import { Footer, Nav, asset } from './parts'

// Privacy and terms, in plain words. Every statement here describes what the app actually does.

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-16">
      <h2 className="heading-5 text-white">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 body-3 text-mist">{children}</div>
    </section>
  )
}

function Legal() {
  return (
    <>
      <Nav links={false} />
      <main id="main" className="bg-night px-4 pb-24 pt-24 sm:px-6">
        <article className="mx-auto max-w-2xl pt-8">
          <a href={asset('')} className="inline-flex items-center gap-2 rounded-lg caption-1 text-mist transition-colors duration-300 ease-soft hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-night">
            <ArrowLeftIcon className="size-4" aria-hidden />Back to Officer Prep
          </a>
          <h1 className="mt-8 heading-3 text-white">Privacy and terms</h1>
          <p className="mt-4 body-3 text-mist">Short version: your preparation stays on your device, the app is free, and it is not official.</p>

          <Section id="privacy" title="Privacy">
            <p>Officer Prep has no accounts and no server of its own. Everything you do in the app, from tests and notes to SSB answers and your study plan, is saved in your browser’s storage on your device. It is not sent anywhere.</p>
            <p>The app sets no cookies and uses no analytics or tracking. Your browser’s local storage keeps two small preferences: your light or dark theme, and whether the app has told you it works offline.</p>
            <p>If you choose to connect Google Drive, the app asks Google for access to only the files it creates or that you open with it, and to a hidden folder for its backups. It cannot see the rest of your Drive. You can disconnect at any time, and remove its access from your Google account settings.</p>
            <p>The current affairs page loads a list of headlines from this website. The list is built from publishers’ public news feeds; opening a headline takes you to the publisher’s own site.</p>
            <p>To delete your data, clear this site’s data in your browser settings. Export a backup first if you want to keep it.</p>
          </Section>

          <Section id="terms" title="Terms">
            <p>Officer Prep is free to use for your own preparation.</p>
            <p>{DISCLAIMER}</p>
            <p>Questions, notes and explanations are written for the app and may contain mistakes. Official question papers and answer keys are linked from the official websites and remain the property of their publishers.</p>
            <p>The app is provided as it is, without any guarantee of results, accuracy or availability. Back up your data regularly: if your browser’s storage is cleared, your progress goes with it.</p>
          </Section>
        </article>
      </main>
      <Footer />
    </>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><Legal /></StrictMode>)
