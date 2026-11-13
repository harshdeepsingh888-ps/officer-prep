# Officer Prep

A self-study app for officer-level exams: **CDS, AFCAT, CAPF AC, Coast Guard AC (CGCAT) and UPSC CSE**. It covers planning, practice, past papers, SSB psych tests and interview prep.
All data stays in your browser (IndexedDB). Back it up from **Library → This device & backups**, or sync it through Google Drive (**Documents**).

**Live:** <https://harshdeepsingh888-ps.github.io/officer-prep/> is the landing page; the app itself is at <https://harshdeepsingh888-ps.github.io/officer-prep/app/>. Old links such as `/officer-prep/#/practice` redirect to the same page under `app/`.

## Install it as an app
The app is a PWA. After the first visit it works offline.
- **Android / laptop (Chrome, Edge):** use the **↓ Install app** button at the top right, or the browser's own install option.
- **iPhone (Safari):** tap Share and choose **Add to Home Screen**.

**On a phone** the main pages sit in a tab bar at the bottom, with icons (Today, Study, Practice, Revise; the rest under **More**). Exams and countdowns are marked in their services' colours: Army olive, Navy blue, Air Force sky blue, CAPF khaki. On touch screens, buttons are at least 36px tall, text fields use 16px text so iPhone doesn't zoom in, and the revision grade buttons stay pinned above the tab bar. The dashboard animation (a brain that morphs into a tank, fighter jet, naval ship, rifle, helicopter and missile, each captioned with its service and motto; pick one below it and drag to turn it to any side) uses fewer particles on small screens, runs at 30 fps on touch devices and stops drawing when scrolled out of view.

**Updates:** when a new version is deployed, a toast says *"A new version of Officer Prep is ready"*. Press **Update now**, or **Later** to finish what you're doing first. The app checks for updates hourly while open. **Library → This device** shows the date of the version you're running.

## Keeping your data safe
- **Storage protection:** an installed app asks the browser to keep its data permanently. You can also press **Protect my data** in Library → This device.
- **Backups:** export a backup file from Library at any time. The dashboard reminds you if there's no backup for a week.
- **Drive sync:** once Google Drive is connected (Documents), the app backs up automatically: when it opens (if the last backup is over 12 hours old) and when you switch away (at most hourly). It never overwrites a newer backup made by another device. On a new device, connect Drive and press **Restore**.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173 (landing page); the app is at /app/
npm run build      # production build in dist/ (served under /officer-prep/)
npm run preview    # http://localhost:4173/officer-prep/
```

## Tests

```bash
npm test           # unit and module tests (Vitest), about 10 seconds
npm run test:e2e   # browser regression tests (Playwright): builds, then drives your installed Chrome
```

- **Unit and module tests** sit next to the code (`src/**/*.test.ts`). They cover the parsers (paste, past papers, answer keys, CSV/JSON import), OMR scoring, spaced repetition, dates, levels, the test builders (every mock full length with the right time and marking), analytics, the database and backups (in an in-memory IndexedDB), the learning loop, every one of the generator templates (400 random runs each), and the integrity of all built-in content: every question, guide, paper, deck and SSB list.
- **Browser regression tests** (`e2e/`) open every page, tab and study guide on a desktop and on a phone in dark mode, failing on any error or sideways scrolling. They also walk through the main flows end to end:
  - Practice: Quick 10, resuming after a reload, a full AFCAT mock, OMR scoring and past-paper import.
  - Your question bank, flashcards and the mistake notebook.
  - Study status, the planner and streaks, and exam dates.
  - News notes and the recap, SSB, Writing.
  - Backup and restore, the theme, the phone menu and Documents.

  Most flow tests run with reduced motion, since the animated backgrounds slow automated clicks down a lot. A full run takes about 7 minutes; the report is written to `e2e-report/`. These tests are not part of the deploy, so run them before a bigger change.

## Deploy
Every push to `main` builds and publishes to GitHub Pages through `.github/workflows/deploy.yml`. Nothing else is needed. The unit and module tests run first; if any fails, nothing is deployed.

The same workflow also runs at 07:00 and 19:00 IST to refresh the current-affairs headlines (`scripts/fetch-news.mjs`, or `npm run news` locally). Rebuilding unchanged code gives identical files, so these runs don't trigger the update toast. GitHub pauses scheduled workflows in a repository with no activity for 60 days; if the headlines stop updating, re-enable the workflow under **Actions** or push any change.

To change the app icons, edit `scripts/make_icons.py` and run `python scripts/make_icons.py`. It needs Pillow.

## What's inside

| Page | What it does |
|---|---|
| Dashboard | Exam countdowns, **readiness score** per exam (syllabus, accuracy, consistency, revision; indicative only), streak, weekly hours, today's tasks, **daily mission** built from what's due, your weakest topic, the next syllabus topic and the SSB test of the day |
| Exams | Pattern, marking, eligibility, selection stages, 2027 dates (official vs tentative), your own exam dates |
| Study | **Study path** per exam in tracks (Maths, English, GK, Reasoning), each split into **sections** (e.g. Maths → Arithmetic, Algebra, Trigonometry, Geometry & mensuration, Statistics) with a progress bar per section, "next up" for each track and target dates spread up to three weeks before the exam. **Topic pages** show what the exam asks, where to read it (NCERT and standard books), original notes, common traps, practice questions and a status tracker (Not started → Learning → Revised → Mastered). Topics without guides yet are still tracked. About 510 built-in questions with explanations (Maths 137, English 138, GK 182, Reasoning 54), plus **question generators**: 61 Maths and Reasoning templates (percentages, profit and loss, interest, ratios, work, trains, HCF/LCM, algebra, logs, trigonometry, mensuration, statistics; series, coding, directions, clocks, calendars, cubes, mirror images …) that create fresh questions with calculated answers and worked explanations, so that practice never runs out. Generators live in `src/data/generators.ts`. Content lives in `src/data/study/`. |
| Planner | Day planner, Pomodoro (25/50/90), manual time log, 7-day chart |
| Practice | **Test types:** Quick 10, **weekly quiz** (this week's topics + your mistakes), all mixing in freshly generated Maths and Reasoning questions (a topic test can also be "generated only"), **sectional tests** and **full mocks** in each paper's pattern (sections, time and per-question marking; a short mock at exam pace when the bank is too small), and **topic tests** by subject, topic, difficulty or "my mistakes" · mark for review, time per question, resume after a reload · **PYQ papers: official UPSC past papers on an OMR sheet** with answer-key scoring (resumable; wrong questions go to the notebook) · **past-paper import**: paste a UPSC paper's text and its answer key and its questions join your bank (Hindi lines and the cover page dropped, figure questions flagged, any booklet-series column) · your own question bank (form, CSV/JSON, or **paste from Telegram/PDF/notes**) · **analytics**: score trend, accuracy by subject, weakest topics, mistake reasons, review activity |
| Progress | **Level** from Rookie to Legend, earned by active study days (a missed day never takes a level away) · **progress report:** current and best streak, an activity calendar of the last 26 weeks, this week against last (study time, tests, accuracy, revision, topics, tasks, SSB, writing), syllabus covered per subject, accuracy by subject, recent tests, and a one-tap weekly report to copy and share |
| News | **Current affairs:** exam-relevant headlines refreshed twice a day from The Hindu's RSS feeds, sorted into National, International, Defence, Economy, Science & tech, Environment, Sports, Appointments and Editorials (India-related stories and explainers first; local crime and gossip filtered out), each linking to the full story · links to official sources (PIB, MoD, MEA, ISRO) · **notes** in your own words, with an optional revision card in a "Current affairs" deck · **weekly recap** of your notes by category, to copy and share |
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

**Light and dark mode:** the toggle at the top right offers Match system, Light or Dark. The choice is saved per device, and `app/index.html` applies it before the first paint so the page doesn't flash.
- Each colour token has a dark value and a light value, set on `<html data-theme>`. Light mode deepens amber, teal and red so text stays readable on white.
- Use `text-fg` and `bg-fg/[…]` for text and overlays, never `text-white` or `bg-white/…`. The one exception is white text on the violet `bg-iris-500` fill.

## Landing page

The site root is a landing page built separately from the app, following the `landing-page-design` skill (Poppins, Tailwind type scale through named text styles such as `heading-3` and `body-6`, flat backgrounds, Phosphor icons, saffron as the one accent). Vite builds four pages: `index.html` (landing), `app/index.html` (the app), `legal.html` (privacy and terms) and `404.html`.
- Code is in `src/landing/`. All copy and the numbers it quotes are in `content.ts`; `content.test.ts` checks those numbers against the app's real data, so the page cannot claim more questions or papers than the app has.
- Screenshots in `public/landing/` are real captures of the app. `public/og.png` is the 1200 by 630 share image shown when the link is pasted in Telegram or WhatsApp.
- Testimonials are `{{testimonial}}` placeholders until there are real ones to quote.

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
