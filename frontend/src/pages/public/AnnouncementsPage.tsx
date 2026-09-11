import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { EmptyPublicState, PageHeader } from '../../components/public/PublicElements'
import { LoadingState } from '../../components/ui/Feedback'
import { Reveal } from '../../components/animation/Reveal'
import { AnnouncementVisual } from '../../components/public/AnnouncementVisual'
import { usePublicAnnouncements } from '../../hooks/usePublicContent'

export function AnnouncementsPage() {
  const { data, isLoading } = usePublicAnnouncements(50)
  const location = useLocation()
  const items = data?.items ?? []

  useEffect(() => {
    if (location.hash && !isLoading && items.length > 0) {
      const el = document.querySelector(location.hash)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 120)
      }
    }
  }, [location.hash, isLoading, items.length])

  const renderGroup = (group: typeof items) =>
    group.length > 0 && (
      <div className="announcement-grid">
        {group.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.08}>
            <AnnouncementVisual item={item} />
          </Reveal>
        ))}
      </div>
    )

  return (
    <>
      <PageHeader
        eyebrow="Parish news"
        title="Notices, shared with care."
        intro="Current parish announcements."
      />
      <section className="section">
        <div className="container">
          {isLoading && <LoadingState text="Loading parish announcements…" />}
          {!isLoading && items.length === 0 && (
            <EmptyPublicState
              title="No announcements"
              detail="Parish notices will appear here when published."
            />
          )}
          {renderGroup(items)}
        </div>
      </section>
    </>
  )
}
