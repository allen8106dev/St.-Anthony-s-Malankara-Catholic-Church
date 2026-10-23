import type { QueryClient } from '@tanstack/react-query'
import { demoImages, ministries } from '../data/siteContent'
import { publicQueries, type PublicAlbum } from '../hooks/usePublicContent'
import { isPublicSessionReady, savePublicSession } from './publicSession'

let startup: Promise<void> | undefined
let progress = 0
const listeners = new Set<() => void>()
// Attempt bounded HTTP requests even when the browser reports itself offline.
const startupOptions = { retry: false, networkMode: 'always' as const }

function report(value: number) {
  progress = Math.max(progress, value)
  listeners.forEach(listener => listener())
}

function preloadImage(src: string, timeout: number): Promise<void> {
  return new Promise(resolve => {
    const img = new Image()
    const timer = window.setTimeout(finish, timeout)
    function finish() {
      window.clearTimeout(timer)
      img.onload = null
      img.onerror = null
      resolve()
    }
    img.onload = () => { img.decode().catch(() => {}).then(finish) }
    img.onerror = finish
    img.src = src
  })
}

async function prepare(client: QueryClient) {
  const assets = new Set([
    '/st-anthony-logo.jpg',
    ...Object.values(demoImages).map(image => image.src),
    ...ministries.map(ministry => ministry.image.src),
  ])
  const addImage = (url: string | null) => { if (url) assets.add(url) }
  const seedAlbum = (album: PublicAlbum) => {
    client.setQueryData(publicQueries.album(album.id).queryKey, album)
    addImage(album.cover_image_url)
    album.images.forEach(image => addImage(image.image_url))
  }

  // Use exactly the same query definitions as pages so navigation reuses this work.
  const tasks: Promise<unknown>[] = [
    client.fetchQuery({ ...publicQueries.settings(), ...startupOptions }),
    client.fetchQuery({ ...publicQueries.liturgy(), ...startupOptions }),
    client.fetchQuery({ ...publicQueries.serviceTimes(), ...startupOptions }),
    client.fetchQuery({ ...publicQueries.content('about'), ...startupOptions }).then(items => items.forEach(item => addImage(item.image_url))),
    client.fetchQuery({ ...publicQueries.heroImages(), ...startupOptions }).then(items => items.forEach(item => addImage(item.image_url))),
    client.fetchQuery({ ...publicQueries.events({ timeframe: 'upcoming', limit: 20 }), ...startupOptions }).then(data => {
      data.items.forEach(item => addImage(item.image_url))
      client.setQueryData(publicQueries.events({ timeframe: 'upcoming', limit: 3 }).queryKey, { ...data, items: data.items.slice(0, 3), meta: { ...data.meta, limit: 3 } })
    }),
    client.fetchQuery({ ...publicQueries.events({ timeframe: 'past', limit: 10 }), ...startupOptions }).then(data => data.items.forEach(item => addImage(item.image_url))),
    client.fetchQuery({ ...publicQueries.announcements(50), ...startupOptions }).then(data => {
      data.items.forEach(item => addImage(item.image_url))
      client.setQueryData(publicQueries.announcements(1).queryKey, { ...data, items: data.items.slice(0, 1), meta: { ...data.meta, limit: 1 } })
    }),
    client.fetchQuery({ ...publicQueries.gallery(50), ...startupOptions }).then(data => {
      data.items.forEach(seedAlbum)
      client.setQueryData(publicQueries.gallery(10).queryKey, { ...data, items: data.items.slice(0, 10), meta: { ...data.meta, limit: 10 } })
    }),
  ]

  // Include an album opened directly, even when it is beyond the gallery's first page.
  const albumMatch = window.location.pathname.match(/^\/gallery\/([^/]+)\/?$/)
  if (albumMatch) {
    tasks.push(client.fetchQuery({ ...publicQueries.album(albumMatch[1]), ...startupOptions }).then(seedAlbum))
  }

  let settled = 0
  await Promise.allSettled(tasks.map(task => task.finally(() => report(Math.round(++settled / tasks.length * 40)))))

  // Resolve failures as well as successes so an unavailable image cannot trap visitors.
  // Limit concurrent image downloads rather than flooding a mobile connection.
  const queue = [...assets]
  const total = queue.length + 1
  let completed = 0
  const assetDone = () => report(40 + Math.round(++completed / total * 59))
  const deadline = performance.now() + 12_000
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      const remaining = deadline - performance.now()
      if (remaining <= 0) break
      await preloadImage(url, remaining)
      assetDone()
    }
  }
  let fontTimer: ReturnType<typeof setTimeout> | undefined
  const fonts = Promise.race([
    Promise.allSettled([
      document.fonts.load('400 1em "DM Sans"'),
      document.fonts.load('600 1em "DM Sans"'),
      document.fonts.load('500 1em "Playfair Display"'),
      document.fonts.load('600 1em "Playfair Display"'),
    ]).then(() => document.fonts.ready),
    new Promise<void>(resolve => { fontTimer = setTimeout(resolve, 12_000) }),
  ]).finally(() => { clearTimeout(fontTimer); assetDone() })
  await Promise.allSettled([fonts, ...Array.from({ length: 6 }, worker)])
}

export const publicStartup = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
  getProgress: () => isPublicSessionReady() ? 100 : progress,
  start(client: QueryClient) {
    if (isPublicSessionReady()) return Promise.resolve()
    // Shared promise survives React StrictMode and layout remounts.
    startup ??= prepare(client).finally(() => { savePublicSession(client); report(100) })
    return startup
  },
}
