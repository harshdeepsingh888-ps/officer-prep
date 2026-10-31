import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import * as drive from './drive'
import { db, exportAll, importAll } from './db'

type Session = 'signed-out' | 'connecting' | 'ready'
export type DriveStatus = 'loading' | 'unconfigured' | Session

type DriveState = {
  config: drive.DriveConfig
  saveConfig: (c: drive.DriveConfig) => Promise<void>
  canPick: boolean
  status: DriveStatus
  user?: drive.DriveUser
  quota?: drive.Quota
  folderId?: string
  docs: drive.DriveDoc[]
  backup: drive.BackupInfo | null
  error: string
  clearError: () => void
  connect: () => Promise<void>
  disconnect: () => void
  refresh: () => Promise<void>
  /** Throws on failure so the caller can show per-file errors. */
  upload: (file: File, tags: drive.DocTags, onProgress?: (pct: number) => void) => Promise<drive.DriveDoc>
  pick: (tags: drive.DocTags) => Promise<number | undefined>
  retag: (doc: drive.DriveDoc, tags: drive.DocTags) => Promise<void>
  remove: (doc: drive.DriveDoc) => Promise<void>
  backupNow: () => Promise<boolean | undefined>
  restore: () => Promise<boolean | undefined>
}

const DriveContext = createContext<DriveState | null>(null)

export function useDrive() {
  const ctx = useContext(DriveContext)
  if (!ctx) throw new Error('useDrive must be used inside <DriveProvider>')
  return ctx
}

export function DriveProvider({ children }: { children: ReactNode }) {
  const saved = useLiveQuery(async () => ((await db.settings.get('driveConfig'))?.value as drive.DriveConfig | undefined) ?? null, [], 'loading' as const)
  const config = saved === 'loading' || saved === null ? drive.envConfig : saved
  const configured = config.clientId.trim() !== ''

  const [session, setSession] = useState<Session>('signed-out')
  const [user, setUser] = useState<drive.DriveUser>()
  const [quota, setQuota] = useState<drive.Quota>()
  const [folderId, setFolderId] = useState<string>()
  const [docs, setDocs] = useState<drive.DriveDoc[]>([])
  const [backup, setBackup] = useState<drive.BackupInfo | null>(null)
  const [error, setError] = useState('')

  async function load() {
    const knownFolder = (await db.settings.get('driveFolderId'))?.value as string | undefined
    const [me, fid] = await Promise.all([drive.about(), drive.ensureFolder(knownFolder)])
    if (fid !== knownFolder) await db.settings.put({ key: 'driveFolderId', value: fid })
    const [list, b] = await Promise.all([drive.listDocs(), drive.findBackup()])
    setUser(me.user)
    setQuota(me.storageQuota)
    setFolderId(fid)
    setDocs(list)
    setBackup(b)
    setSession('ready')
  }

  /** Runs a Drive action, turning failures into the shared error message. */
  async function guard<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      setError('')
      return await fn()
    } catch (e) {
      if (e instanceof drive.AuthError) setSession('signed-out')
      setError((e as Error).message)
      return undefined
    }
  }

  // Reuse a still-valid token from this tab after a reload.
  useEffect(() => {
    if (saved === 'loading' || !configured) return
    drive.preloadAuth()
    if (drive.hasToken()) guard(load)
  }, [saved === 'loading', configured])

  const value: DriveState = {
    config,
    saveConfig: async c => {
      await db.settings.put({ key: 'driveConfig', value: { clientId: c.clientId.trim(), apiKey: c.apiKey.trim(), appId: c.appId.trim() } })
    },
    canPick: config.apiKey.trim() !== '' && config.appId.trim() !== '',
    status: saved === 'loading' ? 'loading' : !configured ? 'unconfigured' : session,
    user, quota, folderId, docs, backup, error,
    clearError: () => setError(''),

    connect: async () => {
      await guard(async () => {
        setSession('connecting')
        try {
          if (!drive.hasToken()) await drive.signIn(config)
          await load()
        } catch (e) {
          setSession('signed-out')
          throw e
        }
      })
    },
    disconnect: () => {
      drive.signOut()
      setSession('signed-out')
      setUser(undefined)
      setDocs([])
      setBackup(null)
    },
    refresh: async () => { await guard(load) },

    upload: async (file, tags, onProgress) => {
      try {
        const fid = folderId ?? (await drive.ensureFolder())
        const doc = await drive.uploadDoc(file, fid, tags, onProgress)
        setDocs(d => [doc, ...d])
        return doc
      } catch (e) {
        if (e instanceof drive.AuthError) setSession('signed-out')
        throw e
      }
    },
    pick: tags => guard(async () => {
      const files = await drive.pickFiles(config)
      const adopted = await Promise.all(files.map(f => drive.adoptDoc(f.id, tags)))
      const ids = new Set(adopted.map(a => a.id))
      setDocs(d => [...adopted, ...d.filter(x => !ids.has(x.id))])
      return adopted.length
    }),
    retag: async (doc, tags) => {
      await guard(async () => {
        const updated = await drive.retagDoc(doc.id, tags)
        setDocs(d => d.map(x => (x.id === doc.id ? updated : x)))
      })
    },
    remove: async doc => {
      await guard(async () => {
        await drive.removeDoc(doc)
        setDocs(d => d.filter(x => x.id !== doc.id))
      })
    },
    backupNow: () => guard(async () => {
      setBackup(await drive.saveBackup(await exportAll()))
      return true
    }),
    restore: () => guard(async () => {
      const b = await drive.findBackup()
      if (!b) throw new Error('There is no backup in your Drive yet. Use "Back up now" on the other device first.')
      // Keep this device's own Drive settings; everything else comes from the backup.
      const keep = await db.settings.bulkGet(['driveConfig', 'driveFolderId'])
      await importAll(await drive.loadBackup(b.id))
      await db.settings.bulkPut(keep.filter(k => k !== undefined))
      return true
    }),
  }

  return <DriveContext.Provider value={value}>{children}</DriveContext.Provider>
}
