# Content admin panel

The admin panel is where the person running the site adds content for everyone who uses the app. It covers:
- questions
- TAT and PPDT pictures
- SSB lists
- study notes
- past papers and answer keys
- notices
- exam dates

Open it at **`/officer-prep/app/#/admin`**. There is also a small *content admin* link at the bottom of the Library page.

## How it works

1. **Edit.** Every change is saved as a draft in this browser, on this device. Students don't see it yet.
2. **Preview.** Tick *Preview the draft in the app on this device*. You then use the app with your draft in place: take a quiz, run a TAT, open a topic page. A banner on every page reminds you, and *Stop preview* ends it.
3. **Publish.** Under *Publish*, press **Publish to the site**.
   - The panel commits the changed files to the repository on GitHub, as one commit. New pictures go into the same commit.
   - The deploy workflow then rebuilds the site, which takes about two minutes.
4. **Students get it.** Every device downloads the new content the next time the app opens or comes back into view, and keeps a copy for offline use.

The site still has no server. Published content is ordinary files in [`public/content/`](../public/content/). GitHub stores them and GitHub Pages serves them.

## One-time setup: a GitHub token

Publishing needs a GitHub account with **write access to this repository**. That requirement is what keeps the panel safe: anyone can open the page and play with a draft in their own browser, but only you can publish.

1. Open GitHub → *Settings* → *Developer settings* → *Personal access tokens* → **Fine-grained tokens** → *Generate new token* (direct link: <https://github.com/settings/personal-access-tokens/new>).
2. Fill in the token:
   - **Expiration:** 90 days is a good choice. Make a new token when it runs out.
   - **Repository access:** *Only select repositories*, then this repository.
   - **Permissions → Repository permissions:**
     - **Contents: Read and write.** This one is required.
     - **Actions: Read.** Optional; the panel uses it to show whether the site has finished rebuilding.
3. Copy the token (it starts with `github_pat_`).
4. In the panel, open **Publish** and fill in:
   - owner, repository and branch (on the live site these are filled in for you)
   - the token

   Press **Connect**.

Where the token is kept:
- It stays in this browser only: in local storage if *Remember on this device* is ticked, otherwise until the tab closes.
- It is never stored in IndexedDB, so it can't end up in a backup file or in Google Drive.
- It is sent only to `api.github.com`.

If you lose the device, revoke the token on GitHub.

## What you can manage

| Tab | What it does |
|---|---|
| **Questions** | Add or edit questions:<br>• subject, topic, exams, difficulty, an optional passage, up to 6 options, explanation, and a source such as "CDS (I) 2024, Q 37"<br>• use a study topic's name (suggested as you type) and the question shows on that topic page<br><br>**Bulk import:**<br>• paste a paper's text plus its official answer key: Hindi lines and the cover page are dropped; figure-based and dropped questions are skipped<br>• or paste numbered questions with answers<br>• or paste CSV or JSON<br>• duplicates of questions already in the bank are left out<br><br>**Built-in:** hide a built-in question (a dated fact, a disputed answer). |
| **TAT & PPDT pictures** | Upload pictures by choosing files or dropping them.<br>• Each is marked TAT, PPDT or both.<br>• Each is scaled to 1600 px and saved as JPEG, about 300 KB.<br>• In the tests they are mixed with each student's own uploads, and written scenes fill any gap.<br>• A caption is optional. It is never shown during the test; it only labels saved answers. |
| **SSB lists** | WAT words, SRT situations, TAT scenes (written), lecturette topics, GD topics, essay topics and interview questions.<br>• One entry per line. For interview questions, a `# Area` line starts a group.<br>• Entries already built in are left out. |
| **Study notes** | Extra note blocks on any study topic:<br>• points, a two-column table, or a worked example<br>• live preview, reordering<br>• `*bold*` markup<br>They appear after the built-in notes. |
| **Papers & keys** | Add past papers: exam, sitting, paper, link to the PDF, questions, marks, minutes.<br>Add official **answer keys** for any paper, built-in or added. A published key fills in a student's OMR scoring automatically. |
| **Notices & dates** | **Notices** on the Today page:<br>• info or important<br>• an optional link and an end date<br>• each student can dismiss one<br><br>**Exam dates:** override an exam's dates when a notification changes them. Countdowns, the study plan and the Exams page follow. A student's own date still wins on their device. |
| **Publish** | Connect and review the changes, then publish. Also here:<br>• **Load latest from GitHub**<br>• **Discard changes**<br>• the history of content commits and the latest deploy's status<br>• **draft files**: save the draft, with unpublished pictures, as a file to move it to another device |

## Safety nets

- **Checks before every publish.** The panel won't publish an entry that is broken: a question without a correct option, a paper link that isn't `https://`, a note for a topic that doesn't exist. The Overview tab lists anything wrong.
- **Checks before every deploy.** `src/content/published.test.ts` checks the committed files again. The deploy runs the tests first, so content that fails never reaches the site.
- **The app can't break on bad content.** If an entry ever fails its check on a device, that entry is skipped and the rest still loads.
- **Two people publishing.** If someone else published after you loaded your draft, both sets of changes are kept. Where you both edited the same entry, yours wins. The same applies when two tabs or devices publish.
- **Undo.** Every publish is a normal commit. Revert it on GitHub (open the commit, then *Revert*), and the site rebuilds without it.

## Notes for developers

- **Pull before you push.** The panel commits straight to `main`, so pull first (`git pull`), or your push will be rejected.
- **The files** are `questions.json`, `pictures.json`, `ssb.json`, `notes.json`, `papers.json` and `site.json` in `public/content/`, with pictures in `public/content/pictures/`.
  - You can edit them by hand. Keep the format: the panel rewrites them normalised, one-space indent.
  - Run `npm test` afterwards, so the content checks run.
- **The code:**
  - `src/content/` holds the format, checks, merge and the store every device uses.
  - `src/admin/` holds the GitHub client, publishing and the draft state.
  - `src/pages/Admin.tsx` and `src/pages/admin/` hold the panel's pages. They load only when the panel is opened, and installed apps don't store them offline.
- **Pictures stay in the git history** even after they are removed, so the repository grows with every picture ever published. At about 300 KB each, a few hundred pictures are fine. GitHub suggests keeping a repository under 1 GB.

## What to publish

- **Pictures.** SSB boards don't release their TAT or PPDT picture sets. Scans of coaching books are usually copyrighted. Publish your own drawings or photos, or images licensed for reuse.
- **Past-paper questions.** UPSC owns its papers. If you import a paper's questions, use the official text and the official key, and give the source. AFCAT and CGCAT don't publish papers, so label memory-based papers as such.
- **Answer keys.** Use the official keys. UPSC publishes them after the final result.
