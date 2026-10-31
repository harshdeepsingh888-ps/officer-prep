# Connect Google Drive (one-time, about 10 minutes, free)

You create a small Google Cloud project of your own, so the app talks to **your** Drive with **your** permission. No third-party server is involved.

## 1. Create a project
1. Open <https://console.cloud.google.com/>.
2. Open the project picker and choose **New project**. Name it `Officer Prep`, click **Create**, then select it.

## 2. Turn on two APIs
1. Go to **APIs & Services → Library**.
2. Search **Google Drive API** and click **Enable**.
3. Search **Google Picker API** and click **Enable**.

## 3. Set up the consent screen
1. Open **Google Auth Platform** (older menus call it *OAuth consent screen*) and click **Get started**.
2. App name: `Officer Prep`. User support email: your Gmail. Click **Next**.
3. Audience: **External**. Click **Next**, add your contact email, accept the policy and click **Create**.
4. Under **Audience → Test users**, click **Add users**, add your Gmail address and save.
5. Under **Data access → Add or remove scopes**, tick these two and save:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.appdata`

   Both are non-sensitive scopes, so Google doesn't need to review your app.

## 4. Create the OAuth client ID
1. Go to **Google Auth Platform → Clients → Create client**.
2. Application type: **Web application**. Name: `Officer Prep web`.
3. Under **Authorized JavaScript origins**, add every address you open the app from:
   - `http://localhost:5173` (for `npm run dev`)
   - `http://localhost:4173` (for `npm run preview`)
   - `https://harshdeepsingh888-ps.github.io` (the live site — origin only, no path)
4. Leave **Authorized redirect URIs** empty and click **Create**.
5. Copy the **Client ID**. It ends in `.apps.googleusercontent.com`.

## 5. Create an API key (only needed for "Pick from Drive")
1. Go to **APIs & Services → Credentials → Create credentials → API key** and copy it.
2. Edit the key:
   - Application restrictions: **Websites**. Add `http://localhost:5173/*`, `http://localhost:4173/*` and `https://harshdeepsingh888-ps.github.io/*`.
   - API restrictions: **Restrict key**, select **Google Picker API**, and save.

## 6. Copy the project number
On the console dashboard, the **Project info** card shows the **Project number** (digits only). It's also under **IAM & Admin → Settings**.

## 7. Give the values to the app
Use either method:
- **In the app:** go to **Documents → Set up Google Drive**, paste the three values and save.
- **In a file:** copy `.env.example` to `.env.local`, fill in the values and restart `npm run dev`.

Now click **Connect Google Drive**. Google will warn that it *hasn't verified this app*. That's expected for your own project in testing mode, so click **Continue** and tick **both** permission boxes.

## What the app can access
| Permission | What it means |
|---|---|
| `drive.file` | Only files the app uploaded, or files you chose with **Pick from Drive**. The rest of your Drive stays invisible to it. |
| `drive.appdata` | A hidden folder only this app can see. It holds your progress backup (`officer-prep-backup.json`). |

Uploads go into an **Officer Prep** folder in My Drive. Removing an uploaded file in the app moves it to Drive's trash, where you can restore it for 30 days. Removing a picked file only untags it; the file stays where it was.

## Troubleshooting
- **"Not a valid origin" / `idpiframe` error:** the address in your browser bar isn't listed under Authorized JavaScript origins. Add it exactly, including the port, with no trailing slash.
- **"Access blocked: app has not completed verification":** your Gmail isn't on the Test users list (step 3.4).
- **Pick from Drive fails:** check that the Picker API is enabled and that the API key's website restrictions include your address.
- **Asked to reconnect:** Google sign-ins last about an hour. Click **Reconnect**.
- **Sharing with friends:** testing mode allows up to 100 test users. Add their Gmail addresses as test users.
