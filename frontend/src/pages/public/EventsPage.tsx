import { demoImages } from '../../data/siteContent'
import { EmptyPublicState, PageHeader } from '../../components/public/PublicElements'
import { LoadingState } from '../../components/ui/Feedback'
import { Reveal } from '../../components/animation/Reveal'
import { usePublicEvents } from '../../hooks/usePublicContent'

export function EventsPage() {
  const { data: upcomingData, isLoading: loadingUp } = usePublicEvents({ timeframe: 'upcoming', limit: 20 })
  const { data: pastData, isLoading: loadingPast } = usePublicEvents({ timeframe: 'past', limit: 10 })
  const upcoming = upcomingData?.items ?? []
  const past = pastData?.items ?? []

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Gatherings to look forward to."
        intro="Upcoming and past parish events."
        image={demoImages.gathering}
      />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Calendar</p>
              <h2 className="heading">Upcoming events</h2>
            </div>
          </div>
          {loadingUp && <LoadingState text="Loading upcoming events…" />}
          {!loadingUp && upcoming.length === 0 && (
            <EmptyPublicState title="No upcoming events" detail="Check back soon for parish gatherings." />
          )}
          <div className="card-grid">
            {upcoming.map((ev, i) => (
              <Reveal key={ev.id} delay={i * 0.08}>
                <article className="content-card">
                  {ev.image_url && <img src={ev.image_url} alt={ev.title} loading="lazy" />}
                  <div>
                    <p className="eyebrow">
                      {ev.category ? `${ev.category} · ` : ''}
                      {new Date(ev.start_datetime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h3>{ev.title}</h3>
                    <p>{ev.description ?? ''}</p>
                    <dl className="meta">
                      <div>
                        <dt>When</dt>
                        <dd>{new Date(ev.start_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</dd>
                      </div>
                      {ev.location && (
                        <div>
                          <dt>Where</dt>
                          <dd>{ev.location}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {(loadingPast || past.length > 0) && (
        <section className="section section--muted">
          <div className="container">
            <p className="eyebrow">Archive</p>
            <h2 className="heading heading--small">Past events</h2>
            <div className="card-grid card-grid--single">
              {past.map((ev) => (
                <article key={ev.id} className="content-card">
                  <div>
                    <p className="eyebrow">
                      {new Date(ev.start_datetime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h3>{ev.title}</h3>
                    <p>{ev.description ?? ''}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

