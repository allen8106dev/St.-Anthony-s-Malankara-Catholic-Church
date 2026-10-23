import { dehydrate, hydrate, type QueryClient } from '@tanstack/react-query'

const STORAGE_KEY = 'church:public-session:v1'
let ready = false

export function isPublicSessionReady() { return ready }

// Persist public content only. Authentication, members and finances never enter this cache.
export function initializePublicSession(client: QueryClient) {
  client.setQueryDefaults(['public'], { gcTime: Infinity })
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      const snapshot = JSON.parse(saved)
      if (snapshot.completed === true && Array.isArray(snapshot.cache?.queries)) {
        hydrate(client, { mutations: [], queries: snapshot.cache.queries.filter(
          (query: { queryKey?: unknown[] }) => query.queryKey?.[0] === 'public',
        ) })
        ready = true
      }
    }
  } catch { /* Storage may be unavailable; the in-memory session still works. */ }

  let timer: ReturnType<typeof setTimeout> | undefined
  client.getQueryCache().subscribe(() => {
    if (!ready || timer) return
    timer = setTimeout(() => {
      timer = undefined
      savePublicSession(client)
    }, 250)
  })
}

export function savePublicSession(client: QueryClient) {
  ready = true
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      completed: true,
      cache: dehydrate(client, {
        shouldDehydrateQuery: query => query.queryKey[0] === 'public' && query.state.status === 'success',
        shouldDehydrateMutation: () => false,
      }),
    }))
  } catch { /* A full or disabled sessionStorage must never prevent entry. */ }
}
