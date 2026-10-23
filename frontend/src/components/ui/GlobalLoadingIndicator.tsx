import { useIsFetching } from '@tanstack/react-query'
import { ChurchLoader } from './ChurchLoader'

export function GlobalLoadingIndicator() {
  const isFetching = useIsFetching()

  if (isFetching === 0) return null

  return (
    <div
      className="global-loading-indicator"
      role="status"
      aria-live="polite"
      aria-label="Updating parish data..."
    >
      <div className="global-loading-indicator__pill">
        <ChurchLoader size="xs" inline ariaLabel="Synchronizing" />
        <span className="global-loading-indicator__text">Loading…</span>
      </div>
    </div>
  )
}

