// A small GitHub REST client for the admin panel: just what loading and publishing content needs.
// It talks to api.github.com from the browser with the owner's own token; nothing passes through any other server.

export type Repo = { owner: string; repo: string; branch: string }

export class GitHubError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

/** What a failed call means, in words the owner can act on. */
function explain(status: number, apiMessage: string, path: string): string {
  if (status === 401) return 'GitHub rejected the token: it may be mistyped, expired or revoked. Make a new one and connect again.'
  if (status === 403 && /rate limit/i.test(apiMessage)) return 'GitHub\'s rate limit was hit. Wait a few minutes and try again.'
  if (status === 403) return 'The token can\'t do this. It needs "Contents: Read and write" on this repository.'
  if (status === 404 && path.startsWith('/repos/') && !path.includes('/contents/')) return 'Repository or branch not found, or the token has no access to it. Check the owner, repository and branch.'
  if (status === 409) return 'The repository is empty. Push the app\'s code to it first.'
  if (status === 422 && /protected/i.test(apiMessage)) return 'The branch is protected, so changes can\'t be pushed to it directly. Pick another branch, or allow the token to push.'
  return `GitHub said: ${apiMessage || `error ${status}`}`
}

export type GitHub = ReturnType<typeof gitHub>

export function gitHub(token: string, repo: Repo, fetcher: typeof fetch = (...a) => fetch(...a)) {
  const base = `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`
  const encPath = (p: string) => p.split('/').map(encodeURIComponent).join('/')

  async function call(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<Response> {
    const { raw, ...rest } = init
    const res = await fetcher(`https://api.github.com${path}`, {
      ...rest,
      // Never a cached answer: a stale branch head would make the next commit fail.
      cache: 'no-store',
      headers: {
        Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
    if (!res.ok) {
      let msg = ''
      try { msg = ((await res.json()) as { message?: string }).message ?? '' } catch { /* not JSON */ }
      throw new GitHubError(res.status, explain(res.status, msg, path))
    }
    return res
  }
  const get = async <T,>(path: string) => (await call(path)).json() as Promise<T>
  const post = async <T,>(path: string, body: unknown, method = 'POST') => (await call(path, { method, body: JSON.stringify(body) })).json() as Promise<T>

  return {
    repo,
    /** The signed-in account, and whether it can push to the repository. */
    async check(): Promise<{ login: string; canPush: boolean; defaultBranch: string; isPrivate: boolean }> {
      const [user, info] = await Promise.all([
        get<{ login: string }>('/user'),
        get<{ permissions?: { push?: boolean }; default_branch: string; private: boolean }>(base),
      ])
      return { login: user.login, canPush: !!info.permissions?.push, defaultBranch: info.default_branch, isPrivate: info.private }
    },
    /** The commit the branch points to now. */
    async head(): Promise<string> {
      const ref = await get<{ object: { sha: string } }>(`${base}/git/ref/heads/${encPath(repo.branch)}`)
      return ref.object.sha
    },
    async treeOf(commit: string): Promise<string> {
      return (await get<{ tree: { sha: string } }>(`${base}/git/commits/${commit}`)).tree.sha
    },
    /** File names in a folder at a commit; an empty list when the folder doesn't exist. */
    async list(dir: string, ref: string): Promise<{ name: string; path: string; sha: string; type: string }[]> {
      try {
        const v = await get<unknown>(`${base}/contents/${encPath(dir)}?ref=${encodeURIComponent(ref)}`)
        return Array.isArray(v) ? v : []
      } catch (e) {
        if (e instanceof GitHubError && e.status === 404) return []
        throw e
      }
    },
    /** A text file at a commit; '' when it doesn't exist. Up to 100 MB (the raw media type has no 1 MB limit). */
    async read(path: string, ref: string): Promise<string> {
      try {
        return await (await call(`${base}/contents/${encPath(path)}?ref=${encodeURIComponent(ref)}`, { raw: true })).text()
      } catch (e) {
        if (e instanceof GitHubError && e.status === 404) return ''
        throw e
      }
    },
    async blob(base64: string): Promise<string> {
      return (await post<{ sha: string }>(`${base}/git/blobs`, { content: base64, encoding: 'base64' })).sha
    },
    async tree(baseTree: string, entries: TreeEntry[]): Promise<string> {
      return (await post<{ sha: string }>(`${base}/git/trees`, { base_tree: baseTree, tree: entries })).sha
    },
    async commit(message: string, tree: string, parent: string): Promise<string> {
      return (await post<{ sha: string }>(`${base}/git/commits`, { message, tree, parents: [parent] })).sha
    },
    /** Moves the branch to the new commit; fails (422) if someone pushed in the meantime. */
    async moveBranch(commit: string): Promise<void> {
      await post(`${base}/git/refs/heads/${encPath(repo.branch)}`, { sha: commit, force: false }, 'PATCH')
    },
    /** Recent commits that touched a folder. */
    async history(dir: string, n = 10): Promise<{ sha: string; message: string; author: string; at: string }[]> {
      const list = await get<{ sha: string; commit: { message: string; author: { name: string; date: string } } }[]>(
        `${base}/commits?sha=${encodeURIComponent(repo.branch)}&path=${encodeURIComponent(dir)}&per_page=${n}`)
      return list.map(c => ({ sha: c.sha, message: c.commit.message.split('\n')[0], author: c.commit.author.name, at: c.commit.author.date }))
    },
    /** The latest deploy runs, or null if the token can't read Actions (that permission is optional). */
    async runs(): Promise<{ status: string; conclusion: string | null; url: string; at: string; sha: string }[] | null> {
      try {
        const v = await get<{ workflow_runs: { status: string; conclusion: string | null; html_url: string; created_at: string; head_sha: string }[] }>(
          `${base}/actions/runs?branch=${encodeURIComponent(repo.branch)}&per_page=3`)
        return v.workflow_runs.map(r => ({ status: r.status, conclusion: r.conclusion, url: r.html_url, at: r.created_at, sha: r.head_sha }))
      } catch (e) {
        if (e instanceof GitHubError && (e.status === 403 || e.status === 404)) return null
        throw e
      }
    },
  }
}

/** A file to write (`content` for text, `sha` of an uploaded blob) or to delete (`sha: null`). */
export type TreeEntry = { path: string; mode: '100644'; type: 'blob'; content?: string; sha?: string | null }

/** Base64 of a file's bytes, for uploading pictures. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

/** owner/repo from a GitHub Pages address: owner.github.io/repo/… */
export function repoFromLocation(loc: { hostname: string; pathname: string }): { owner: string; repo: string } | null {
  const m = loc.hostname.match(/^([a-z0-9-]+)\.github\.io$/i)
  const repo = loc.pathname.split('/').filter(Boolean)[0]
  return m && repo ? { owner: m[1], repo } : null
}
