import { Link } from 'react-router-dom'
import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/animation/Reveal'
import { usePublicEvents, usePublicServiceTimes, usePublicContent, usePublicSettings } from '../../hooks/usePublicContent'
import { ministryPreviews, siteName } from '../../data/siteContent'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function HomePage() {
  const { data: eventsData } = usePublicEvents({ timeframe: 'upcoming', limit: 3 })
  const { data: serviceTimes } = usePublicServiceTimes()
  const { data: heroContent } = usePublicContent('homepage')
  const { data: settings } = usePublicSettings()
  const s = Object.fromEntries((settings ?? []).map(item => [item.key, item.value]))
  const churchName = s.church_name || siteName

  const heroSection = heroContent?.find(s => s.section === 'hero')
  const introSection = heroContent?.find(s => s.section === 'intro')
  const visitSection = heroContent?.find(s => s.section === 'visit')
  const ctaSection = heroContent?.find(s => s.section === 'cta')

  const upcomingEvents = eventsData?.items ?? []
  const activeServiceTimes = serviceTimes ?? []

  return <>
    <section className="hero">
      {heroSection?.image_url && (
        <img src={heroSection.image_url} alt="" className="hero__bg-img" aria-hidden="true" />
      )}
      <div className="hero__art" aria-hidden="true" />
      <Container className="hero__content">
        <Reveal>
          <p className="eyebrow">A place to belong</p>
          <h1 className="display">{heroSection?.heading ?? `Faith, family, and a warm welcome at ${churchName}.`}</h1>
          <p className="lede">{heroSection?.body ?? `${churchName} is preparing a home online for prayer, community, and parish life.`}</p>
          <div className="actions">
            <Link className="button button--light" to="/about">Discover our parish <span aria-hidden="true">↗</span></Link>
            <Link className="button button--outline" to="/contact">Plan a visit</Link>
          </div>
        </Reveal>
      </Container>
    </section>

    <section className="schedule">
      <Container>
        <div className="schedule__panel">
          <div className="schedule__intro">
            <p className="eyebrow">Gather with us</p>
            <h2>Service times</h2>
          </div>
          <div className="schedule__list">
            {activeServiceTimes.length > 0 ? (
              activeServiceTimes.slice(0, 3).map(st => (
                <div className="schedule__item" key={st.id}>
                  <p>{DAYS[st.day_of_week]}</p>
                  <strong>{st.start_time.slice(0, 5)}</strong>
                  <p>{st.service_name}{st.location ? ` · ${st.location}` : ''}</p>
                </div>
              ))
            ) : (
              <div className="schedule__item">
                <p>Schedule</p>
                <strong>To be confirmed</strong>
                <p>Service times will appear here</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>

    <section className="section">
      <Container className="intro-grid">
        <Reveal>
          <p className="eyebrow">Welcome</p>
          <h2 className="heading">{introSection?.heading ?? "A community shaped by prayer and presence."}</h2>
        </Reveal>
        <Reveal delay={.1}>
          <p className="lede">{introSection?.body ?? "This is a visual prototype for the parish's future public website."}</p>
          <Link className="text-link" to="/about">Learn about our parish <span aria-hidden="true">→</span></Link>
        </Reveal>
      </Container>
    </section>

    <section className="section--tight">
      <Container>
        <Reveal>
          <div className="photo-placeholder feature-image" role="img" aria-label="Parish photograph" />
        </Reveal>
      </Container>
    </section>

    <section className="section">
      <Container>
        <div className="section-head">
          <div>
            <p className="eyebrow">What's ahead</p>
            <h2 className="heading">Gatherings to look forward to.</h2>
          </div>
          <Link className="text-link" to="/events">View all events <span aria-hidden="true">→</span></Link>
        </div>
        <div className="event-grid">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <Reveal key={event.id} delay={index * .07}>
                <article className="event">
                  <span className="event__date">
                    {new Date(event.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <h3>{event.title}</h3>
                  <p>{event.description ?? ''}</p>
                  <Link className="text-link" to="/events">Details <span aria-hidden="true">→</span></Link>
                </article>
              </Reveal>
            ))
          ) : (
            <Reveal>
              <article className="event">
                <span className="event__date">Coming soon</span>
                <h3>Events will appear here</h3>
                <p>Check back for upcoming parish gatherings.</p>
              </article>
            </Reveal>
          )}
        </div>
      </Container>
    </section>

    <section className="section--tight">
      <Container>
        <Reveal>
          <article className="sermon">
            <div className="sermon__art photo-placeholder" role="img" aria-label="Sermon artwork" />
            <div className="sermon__body">
              <p className="eyebrow">Latest message</p>
              <h2 className="heading">Messages that meet us where we are.</h2>
              <p>Homilies, reflections, and recordings will live here.</p>
              <Link className="button button--light" to="/sermons">Explore messages <span aria-hidden="true">↗</span></Link>
            </div>
          </article>
        </Reveal>
      </Container>
    </section>

    <section className="section ministries">
      <Container>
        <div className="section-head">
          <div>
            <p className="eyebrow">Parish life</p>
            <h2 className="heading">Many ways to grow together.</h2>
          </div>
          <Link className="text-link" to="/ministries">Explore ministries <span aria-hidden="true">→</span></Link>
        </div>
        <div className="ministry-grid">
          {ministryPreviews.map((ministry, index) => (
            <Reveal key={ministry.number} delay={index * .07}>
              <article className="ministry">
                <span>{ministry.number}</span>
                <h3>{ministry.title}</h3>
                <p>{ministry.detail}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>

    <section className="section">
      <Container>
        <div className="section-head">
          <div>
            <p className="eyebrow">Our community</p>
            <h2 className="heading">The beauty of being together.</h2>
          </div>
          <Link className="text-link" to="/gallery">View gallery <span aria-hidden="true">→</span></Link>
        </div>
        <Reveal>
          <div className="gallery" aria-label="Parish photographs">
            <div className="photo-placeholder" />
            <div className="photo-placeholder" />
            <div className="photo-placeholder" />
          </div>
        </Reveal>
      </Container>
    </section>

    <section className="section--tight">
      <Container>
        <article className="visit">
          <div className="visit__map" role="img" aria-label="Location" />
          <div className="visit__body">
            <p className="eyebrow">Find your way</p>
            <h2 className="heading heading--small">{visitSection?.heading ?? "Come as you are."}</h2>
            <p>{visitSection?.body ?? "Visitor information and directions will be shared here."}</p>
            <Link className="text-link" to="/contact">Plan your visit <span aria-hidden="true">→</span></Link>
          </div>
        </article>
      </Container>
    </section>

    <section className="section cta">
      <Container>
        <Reveal>
          <p className="eyebrow" style={{ color: '#fff' }}>Stay connected</p>
          <h2 className="heading">{ctaSection?.heading ?? "There is a place for you here."}</h2>
          <p>{ctaSection?.body ?? "Explore the parish, find a service, or get in touch."}</p>
          <div className="actions">
            <Link className="button button--light" to="/contact">Contact the parish <span aria-hidden="true">↗</span></Link>
          </div>
        </Reveal>
      </Container>
    </section>
  </>
}
