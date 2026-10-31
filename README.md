# Officer Prep

A self-study app for officer-level exams: **CDS, AFCAT, CAPF AC, Coast Guard AC (CGCAT) and UPSC CSE**. It covers planning, practice, past papers, SSB psych tests and interview prep.
All data stays in your browser (IndexedDB). Back it up from **Library → This device & backups**, or sync it through Google Drive (**Documents**).

**Live:** <https://harshdeepsingh888-ps.github.io/officer-prep/>

## Install it as an app
The app is a PWA. After the first visit it works offline.
- **Android / laptop (Chrome, Edge):** use the **↓ Install app** button at the top right, or the browser's own install option.
- **iPhone (Safari):** tap Share and choose **Add to Home Screen**.

**On a phone** the main pages sit in a tab bar at the bottom (Today, Study, Practice, Revise; the rest under **More**). On touch screens, buttons are at least 36px tall, text fields use 16px text so iPhone doesn't zoom in, and the revision grade buttons stay pinned above the tab bar. The dashboard animation (a brain that morphs into a tank, fighter jet, naval ship, rifle, helicopter and missile; pick one below it and drag to turn it to any side) uses fewer particles on small screens, runs at 30 fps on touch devices and stops drawing when scrolled out of view.

**Updates:** when a new version is deployed, a toast says *"A new version of Officer Prep is ready"*. Press **Update now**, or **Later** to finish what you're doing first. The app checks for updates hourly while open. **Library → This device** shows the build time of the version you're running.

## Keeping your data safe
- **Storage protection:** an installed app asks the browser to keep its data permanently. You can also press **Protect my data** in Library → This device.
- **Backups:** export a backup file from Library at any time. The dashboard reminds you if there's no backup for a week.
- **Drive sync:** once Google Drive is connected (Documents), the app backs up automatically: when it opens (if the last backup is over 12 hours old) and when you switch away (at most hourly). It never overwrites a newer backup made by another device. On a new device, connect Drive and press **Restore**.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/ (served under /officer-prep/)
npm run preview    # http://localhost:4173/officer-prep/
```

## Deploy
Every push to `main` builds and publishes to GitHub Pages through `.github/workflows/deploy.yml`. Nothing else is needed.

To change the app icons, edit `scripts/make_icons.py` and run `python scripts/make_icons.py`. It needs Pillow.

## What's inside

| Page | What it does |
|---|---|
| Dashboard | Exam countdowns, **readiness score** per exam (syllabus, accuracy, consistency, revision; indicative only), streak, weekly hours, today's tasks, **daily mission** built from what's due, your weakest topic, the next syllabus topic and the SSB test of the day |
| Exams | Pattern, marking, eligibility, selection stages, 2027 dates (official vs tentative), your own exam dates |
| Study | **Study path** per exam in tracks (Maths, English, GK, Reasoning), with "next up" for each track and target dates spread up to three weeks before the exam. **Topic pages** show what the exam asks, where to read it (NCERT and standard books), original notes, common traps, practice questions and a status tracker (Not started → Learning → Revised → Mastered). Topics without guides yet are still tracked. Content lives in `src/data/study/`. |
| Planner | Day planner, Pomodoro (25/50/90), manual time log, 7-day chart |
| Practice | **Test types:** Quick 10, **weekly quiz** (this week's topics + your mistakes), **sectional tests** and **full mocks** in each paper's pattern (sections, time and per-question marking; a short mock at exam pace when the bank is too small), and **topic tests** by subject, topic, difficulty or "my mistakes" · mark for review, time per question, resume after a reload · **PYQ papers: official UPSC past papers on an OMR sheet** with answer-key scoring (resumable; wrong questions go to the notebook) · your own question bank (form, CSV/JSON, or **paste from Telegram/PDF/notes**) · **analytics**: score trend, accuracy by subject, weakest topics, mistake reasons, review activity |
| Progress | **Progress report:** current and best streak, an activity calendar of the last 26 weeks, this week against last (study time, tests, accuracy, revision, topics, tasks, SSB, writing), syllabus covered per subject, accuracy by subject, recent tests, and a one-tap weekly report to copy and share |
| Revise | **Spaced repetition** (SM-2 style): today's review, with mistakes first and new flashcards capped per day · **mistake notebook** (every wrong quiz answer is saved automatically; past-paper and manual mistakes too; reasons and notes; mastered after a 3-week interval) · **flashcards**: starter decks (ranks and commands, exercises, missiles, polity, vocabulary, maths formulas) and your own, added one by one or pasted in bulk |
| SSB & Interview | WAT, SRT, TAT, PPDT, SD, Lecturette on real timings · OLQ self-assessment · interview questions generated from your PIQ/DAF · your own TAT/PPDT pictures |
| Writing | Timed essay / précis / report with word count (CAPF Paper II, CSE Mains) |
| Documents | **Google Drive:** upload or pick papers, notes and books (tagged by exam and type), open them on any device, and back up / restore progress between phone and laptop. Setup: [docs/google-drive-setup.md](docs/google-drive-setup.md) |
| Library | Official links (UPSC, AFCAT, ICG, Army, NCERT, PIB), all 2024–26 UPSC paper PDFs, your links, backup/restore |

## Design

The look follows a "constellation on black velvet" design system:
- **Canvas and text:** a pure black canvas, Inter (weight 400 headlines with tight tracking, light body copy), and amber uppercase labels for sections.
- **Accent:** one violet accent (`iris-500`, `#8052ff`), reserved for primary actions and active states.
- **Layout:** no cards, borders or shadows. Sections are separated by whitespace.
- **Visuals:** the dashboard's rotating brain of outlined triangles and the drifting background particles live in `src/components/Particles.tsx`. Both stay still when the system's reduced-motion setting is on.

Tokens are in `src/index.css` (`ink`, `iris`, `saffron`, `verdant`, `ember`, plus `fg` and `canvas`). Shared pieces are in `src/components/ui.tsx`.

**Light and dark mode:** the toggle at the top right offers Match system, Light or Dark. The choice is saved per device, and `index.html` applies it before the first paint so the page doesn't flash.
- Each colour token has a dark value and a light value, set on `<html data-theme>`. Light mode deepens amber, teal and red so text stays readable on white.
- Use `text-fg` and `bg-fg/[…]` for text and overlays, never `text-white` or `bg-white/…`. The one exception is white text on the violet `bg-iris-500` fill.

## Sources

- Past papers link to `upsc.gov.in/sites/default/files/…`. They are **not copied** into the app; UPSC owns them.
- 2027 dates come from the UPSC Annual Calendar 2027 (CDS I 11 Apr, CSE Prelims 23 May, CAPF 4 Jul, CDS II 19 Sep). AFCAT and CGCAT dates are estimates until their notifications are out.
- NCERT forbids bundling its books in apps, so the Library links to ncert.nic.in instead.
- Starter questions, WAT words, SRT situations, TAT scenes and topics were written for this app.

Edit `src/data/exams.ts` when a new notification changes a date or pattern, and `src/data/sources.ts` to add newer papers.

## Roadmap

- Study reminders (notifications)
- Current-affairs journal with monthly quiz
- Fitness log (run times, push-ups, PET targets)
- AI feedback on TAT/WAT/SRT and mock interviews (Claude API via a small server function)
- One-click "save UPSC paper to Drive" through a small server function (UPSC doesn't allow cross-site browser downloads)
