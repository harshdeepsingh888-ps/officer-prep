// Google Drive integration — runs entirely in the browser, no server needed.
// Scopes: drive.file (only files this app creates or you pick) + drive.appdata (hidden folder for progress backups).
// Setup: docs/google-drive-setup.md

export type DriveConfig = { clientId: string; apiKey: string; appId: string }
export type DocKind = 'paper' | 'notes' | 'book' | 'key' | 'other'
export type DocTags = { kind: DocKind; exam?: string; subject?: string; paperId?: string }
export type DriveDoc = {
  id: string
  name: string
  mimeType: string
  size?: string
  webViewLink?: string
  iconLink?: string
  modifiedTime: string
  appProperties?: Record<string, string>
}
export type DriveUser = { displayName: string; emailAddress: string; photoLink?: string }
export type Quota = { limit?: string; usage: string }
export type BackupInfo = { id: string; modifiedTime: string; size?: string }

const FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const FOLDER_NAME = 'Officer Prep'
const BACKUP_NAME = 'officer-prep-backup.json'
const TOKEN_KEY = 'officer-prep-drive-token'
const DOC_FIELDS = 'id,name,mimeType,size,webViewLink,iconLink,modifiedTime,appProperties'
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=UTF-8' }

export class AuthError extends Error {
  constructor() { super('Your Google Drive session has expired. Reconnect to continue.') }
}

export const envConfig: DriveConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY ?? '',
  appId: import.meta.env.VITE_GOOGLE_APP_ID ?? '',
}

// ── Minimal typings for Google's browser libraries ──────────────────
type TokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string }
type TokenClient = { requestAccessToken: (o?: { prompt?: string }) => void }
type GoogleNS = {
  accounts: {
    oauth2: {
      initTokenClient: (c: {
        client_id: string
        scope: string
        callback: (r: TokenResponse) => void
        error_callback?: (e: { type: string; message?: string }) => void
      }) => TokenClient
      hasGrantedAllScopes: (r: TokenResponse, ...scopes: string[]) => boolean
      revoke: (token: string, done?: () => void) => void
    }
  }
  picker: any // Google Picker has no published types
}
declare global {
  interface Window { google?: GoogleNS; gapi?: { load: (lib: string, cb: () => void) => void } }
}

const scripts = new Map<string, Promise<void>>()
function loadScript(src: string) {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => { scripts.delete(src); reject(new Error('Could not load Google sign-in. Check your internet connection.')) }
      document.head.appendChild(s)
    }))
  }
  return scripts.get(src)!
}

/** Load Google's sign-in library early, so the popup opens straight from the button click. */
export const preloadAuth = () => loadScript('https://accounts.google.com/gsi/client').catch(() => {})

// ── Access token (kept for this tab only; Google tokens last ~1 hour) ─
function storedToken(): string | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? 'null') as { token: string; expiresAt: number } | null
    return s && s.expiresAt > Date.now() + 60_000 ? s.token : null
  } catch {
    return null
  }
}
export const hasToken = () => storedToken() !== null
const clearToken = () => sessionStorage.removeItem(TOKEN_KEY)
function token() {
  const t = storedToken()
  if (!t) throw new AuthError()
  return t
}

export async function signIn(cfg: DriveConfig): Promise<void> {
  await loadScript('https://accounts.google.com/gsi/client')
  const oauth = window.google!.accounts.oauth2
  return new Promise((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: cfg.clientId,
      scope: `${FILE_SCOPE} ${APPDATA_SCOPE}`,
      callback: r => {
        if (r.error || !r.access_token) return reject(new Error(r.error_description || r.error || 'Sign-in failed'))
        if (!oauth.hasGrantedAllScopes(r, FILE_SCOPE, APPDATA_SCOPE)) {
          return reject(new Error('Both permissions are needed: files created by this app, and its own app data folder. Please connect again and tick both.'))
        }
        sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token: r.access_token, expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000 }))
        resolve()
      },
      error_callback: e => reject(new Error(e.type === 'popup_closed' ? 'The Google sign-in window was closed.' : e.type === 'popup_failed_to_open' ? 'The browser blocked the sign-in popup. Allow popups for this site.' : e.message || 'Sign-in failed')),
    })
    client.requestAccessToken({ prompt: '' })
  })
}

export function signOut() {
  const t = storedToken()
  clearToken()
  if (t && window.google) window.google.accounts.oauth2.revoke(t)
}

// ── REST helper ─────────────────────────────────────────────────────
async function call<T>(url: string, init: RequestInit & { headers?: Record<string, string> } = {}, as: 'json' | 'text' = 'json'): Promise<T> {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token()}`, ...init.headers } })
  if (res.status === 401) { clearToken(); throw new AuthError() }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { msg = (await res.json()).error?.message ?? msg } catch { /* not JSON */ }
    throw new Error(`Google Drive: ${msg}`)
  }
  if (res.status === 204) return undefined as T
  return (as === 'text' ? res.text() : res.json()) as Promise<T>
}

export const about = () =>
  call<{ user: DriveUser; storageQuota: Quota }>(`${API}/about?fields=user(displayName,emailAddress,photoLink),storageQuota(limit,usage)`)

/** The "Officer Prep" folder in My Drive, created on first use. */
export async function ensureFolder(knownId?: string): Promise<string> {
  if (knownId) {
    try {
      const f = await call<{ id: string; trashed: boolean }>(`${API}/files/${knownId}?fields=id,trashed`)
      if (!f.trashed) return f.id
    } catch (e) {
      if (e instanceof AuthError) throw e
    }
  }
  const q = encodeURIComponent(`mimeType='${FOLDER_MIME}' and name='${FOLDER_NAME}' and trashed=false`)
  const found = await call<{ files: { id: string }[] }>(`${API}/files?q=${q}&fields=files(id)&pageSize=1`)
  if (found.files[0]) return found.files[0].id
  const made = await call<{ id: string }>(`${API}/files?fields=id`, {
    method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME }),
  })
  return made.id
}

export const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`

/** Every file tagged for Officer Prep — uploads and files picked from your Drive. */
export async function listDocs(): Promise<DriveDoc[]> {
  const q = encodeURIComponent(`appProperties has { key='officerPrep' and value='1' } and trashed=false`)
  const out: DriveDoc[] = []
  let page = ''
  do {
    const r = await call<{ files: DriveDoc[]; nextPageToken?: string }>(
      `${API}/files?q=${q}&fields=nextPageToken,files(${DOC_FIELDS})&pageSize=200&orderBy=modifiedTime desc${page ? `&pageToken=${page}` : ''}`,
    )
    out.push(...r.files)
    page = r.nextPageToken ?? ''
  } while (page)
  return out
}

/** Drive caps each appProperty at 124 bytes (key + value, UTF-8). */
function fitBytes(s: string, max: number) {
  const enc = new TextEncoder()
  let out = s
  while (enc.encode(out).length > max) out = out.slice(0, -1)
  return out
}

/** Tag values as appProperties; null removes a key. */
function tagProps(t: DocTags): Record<string, string | null> {
  return { kind: t.kind, exam: t.exam || null, subject: t.subject ? fitBytes(t.subject, 110) : null, paperId: t.paperId || null }
}
const dropNulls = (o: Record<string, string | null>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null)) as Record<string, string>

export async function uploadDoc(file: File, folderId: string, tags: DocTags, onProgress?: (pct: number) => void): Promise<DriveDoc> {
  const type = file.type || 'application/octet-stream'
  const meta = { name: file.name, parents: [folderId], appProperties: dropNulls({ officerPrep: '1', origin: 'upload', ...tagProps(tags) }) }

  // Resumable upload: handles large PDFs and reports progress.
  const start = await fetch(`${UPLOAD}/files?uploadType=resumable&fields=${DOC_FIELDS}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, ...JSON_HEADERS, 'X-Upload-Content-Type': type, 'X-Upload-Content-Length': String(file.size) },
    body: JSON.stringify(meta),
  })
  if (start.status === 401) { clearToken(); throw new AuthError() }
  if (!start.ok) throw new Error(`Google Drive: upload could not start (HTTP ${start.status})`)
  const session = start.headers.get('Location')
  if (session) return send('PUT', session, file, { 'Content-Type': type }, onProgress)

  // Fallback: multipart upload in one request.
  const boundary = `officerprep${Date.now()}`
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${type}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ])
  return send('POST', `${UPLOAD}/files?uploadType=multipart&fields=${DOC_FIELDS}`, body,
    { Authorization: `Bearer ${token()}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, onProgress)
}

function send(method: string, url: string, body: Blob, headers: Record<string, string>, onProgress?: (pct: number) => void): Promise<DriveDoc> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest()
    x.open(method, url)
    for (const [k, v] of Object.entries(headers)) x.setRequestHeader(k, v)
    x.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)) }
    x.onload = () => {
      if (x.status === 401) { clearToken(); reject(new AuthError()) }
      else if (x.status >= 200 && x.status < 300) resolve(JSON.parse(x.responseText))
      else reject(new Error(`Google Drive: upload failed (HTTP ${x.status})`))
    }
    x.onerror = () => reject(new Error('Upload failed — check your connection.'))
    x.send(body)
  })
}

export const retagDoc = (id: string, tags: DocTags) =>
  call<DriveDoc>(`${API}/files/${id}?fields=${DOC_FIELDS}`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ appProperties: tagProps(tags) }) })

/** Tag a file you picked from your Drive so it shows up in Officer Prep. It stays where it is. */
export const adoptDoc = (id: string, tags: DocTags) =>
  call<DriveDoc>(`${API}/files/${id}?fields=${DOC_FIELDS}`, {
    method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ appProperties: { officerPrep: '1', origin: 'picked', ...tagProps(tags) } }),
  })

/** Uploaded files go to Drive's trash (restorable for 30 days); picked files are only untagged. */
export async function removeDoc(doc: DriveDoc) {
  const body = doc.appProperties?.origin === 'upload'
    ? { trashed: true }
    : { appProperties: { officerPrep: null, origin: null, kind: null, exam: null, subject: null, paperId: null } }
  await call(`${API}/files/${doc.id}?fields=id`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify(body) })
}

/** Google Picker — choose existing files from your Drive. */
export async function pickFiles(cfg: DriveConfig): Promise<{ id: string; name: string }[]> {
  await loadScript('https://apis.google.com/js/api.js')
  await new Promise<void>(r => window.gapi!.load('picker', () => r()))
  const p = window.google!.picker
  const oauthToken = token()
  return new Promise(resolve => {
    const view = new p.DocsView(p.ViewId.DOCS).setIncludeFolders(true).setMode(p.DocsViewMode.LIST)
    new p.PickerBuilder()
      .setAppId(cfg.appId)
      .setOAuthToken(oauthToken)
      .setDeveloperKey(cfg.apiKey)
      .addView(view)
      .enableFeature(p.Feature.MULTISELECT_ENABLED)
      .setTitle('Add files to Officer Prep')
      .setCallback((d: { action: string; docs?: { id: string; name: string }[] }) => {
        if (d.action === p.Action.PICKED) resolve((d.docs ?? []).map(x => ({ id: x.id, name: x.name })))
        else if (d.action === p.Action.CANCEL) resolve([])
      })
      .build()
      .setVisible(true)
  })
}

// ── Progress backup in the hidden app-data folder ───────────────────
export async function findBackup(): Promise<BackupInfo | null> {
  const q = encodeURIComponent(`name='${BACKUP_NAME}' and trashed=false`)
  const r = await call<{ files: BackupInfo[] }>(`${API}/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime,size)&pageSize=1`)
  return r.files[0] ?? null
}

export async function saveBackup(json: string): Promise<BackupInfo> {
  let id = (await findBackup())?.id
  if (!id) {
    id = (await call<{ id: string }>(`${API}/files?fields=id`, {
      method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ name: BACKUP_NAME, parents: ['appDataFolder'], mimeType: 'application/json' }),
    })).id
  }
  return call<BackupInfo>(`${UPLOAD}/files/${id}?uploadType=media&fields=id,modifiedTime,size`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: json })
}

export const loadBackup = (id: string) => call<string>(`${API}/files/${id}?alt=media`, {}, 'text')
