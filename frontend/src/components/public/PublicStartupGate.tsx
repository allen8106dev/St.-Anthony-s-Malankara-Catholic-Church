import { useEffect, useState, useSyncExternalStore, type PropsWithChildren } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isPublicSessionReady } from '../../services/publicSession'
import { publicStartup } from '../../services/publicStartup'
import { ChurchLoader } from '../ui/ChurchLoader'

export function PublicStartupGate({ children }: PropsWithChildren) {
  const client = useQueryClient()
  const [revealed, setRevealed] = useState(isPublicSessionReady)
  const progress = useSyncExternalStore(publicStartup.subscribe, publicStartup.getProgress)

  useEffect(() => {
    if (!revealed) void publicStartup.start(client).catch(() => { /* Existing page fallbacks remain available. */ })
  }, [client, revealed])

  useEffect(() => {
    if (revealed || progress < 100) return
    const timer = setTimeout(() => setRevealed(true), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250)
    return () => clearTimeout(timer)
  }, [progress, revealed])

  // Mount pages after preparation so their entrance animations start when visible.
  return revealed ? children : <ChurchLoader fullScreen progress={progress} text={progress === 100 ? 'Welcome to our parish' : 'Preparing your visit'} />
}
