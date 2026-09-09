import { useIsFetching } from '@tanstack/react-query'
import { BibleLoader } from './BibleLoader'

export function GlobalLoadingIndicator() {
  const isFetching = useIsFetching()

  if (isFetching === 0) return null

  return (
    <div
      className="global-bible-loader"
      role="status"
      aria-live="polite"
      aria-label="Updating parish data..."
    >
      <div className="global-bible-loader__pill">
        <BibleLoader size="xs" inline ariaLabel="Synchronizing" />
        <span className="global-bible-loader__text">Loading…</span>
      </div>
    </div>
  )
}

