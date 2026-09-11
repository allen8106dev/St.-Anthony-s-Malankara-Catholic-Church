import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../../components/ui/Container'
import { Reveal } from '../../components/animation/Reveal'
import { HeroSlideshow } from '../../components/public/HeroSlideshow'
import { usePublicEvents, usePublicSettings, usePublicGallery, usePublicHeroImages } from '../../hooks/usePublicContent'
import { demoImages, ministryPreviews, siteName } from '../../data/siteContent'

export function HomePage() {
  const { data: eventsData } = usePublicEvents({ timeframe: 'upcoming', limit: 3 })
  const { data: settings } = usePublicSettings()
  const { data: galleryData } = usePublicGallery(10)
  const { data: heroImages } = usePublicHeroImages()
  const s = Object.fromEntries((settings ?? []).map(item => [item.key, item.value]))
  const churchName = s.church_name || siteName
  const [heroPaused, setHeroPaused] = useState(false)

  const upcomingEvents = eventsData?.items ?? []

  // Collect images from all albums (most recently added first) and take 3
  const allGalleryImages = (galleryData?.items ?? []).flatMap(album => album.images)
  const previewImages = allGalleryImages.slice(0, 3)

  return <>
    <section className="hero hero--full">
      <HeroSlideshow
        slides={heroImages ?? []}
        fallbackSrc={demoImages.sanctuary.src}
        paused={heroPaused}
        onPauseChange={() => setHeroPaused(value => !value)}
      />
      <div className="hero__art" aria-hidden="true" />
      <Container className="hero__content">
        <Reveal>
          <p className="eyebrow">Welcome to our parish family</p>
          <h1 className="display">{`Faith, fellowship, and a place to call home.`}</h1>
          <p className="lede">{`Join ${churchName} for prayer, worship, and the shared life of our parish community.`}</p>
          <div className="actions">
            <Link className="button button--light" to="/about">Discover our parish <span aria-hidden="true">↗</span></Link>
          </div>
        </Reveal>
      </Container>
    </section>

    <section className="section">
      <Container className="intro-grid">
        <Reveal>
          <p className="eyebrow">Welcome</p>
          <h2 className="heading">A community shaped by prayer and presence.</h2>
        </Reveal>
        <Reveal delay={.1}>
          <p className="lede">This is a visual prototype for the parish's future public website.</p>
          <Link className="text-link" to="/about">Learn about our parish <span aria-hidden="true">→</span></Link>
        </Reveal>
      </Container>
    </section>

    <div className="marquee" aria-label="Welcome to the parish">
      <div className="marquee__track"><span>Welcome to our parish</span><span aria-hidden="true">✦</span><span>Prayer · Community · Belonging</span><span aria-hidden="true">✦</span><span>Welcome to our parish</span><span aria-hidden="true">✦</span></div>
    </div>

    <section className="section--tight">
      <Container>
        <Reveal>
          <figure className="feature-image">
            <img src={demoImages.gathering.src} alt={demoImages.gathering.alt} loading="lazy" />
            <figcaption>Life shared in community</figcaption>
          </figure>
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
        <div className="event-grid event-grid--track">
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
            {previewImages.length > 0 ? (
              previewImages.map(img => (
                <img key={img.id} src={img.image_url} alt={img.alt_text} loading="lazy" />
              ))
            ) : (
              <>
                <img src={demoImages.sanctuary.src} alt={demoImages.sanctuary.alt} loading="lazy" />
                <img src={demoImages.prayer.src} alt={demoImages.prayer.alt} loading="lazy" />
                <img src={demoImages.community.src} alt={demoImages.community.alt} loading="lazy" />
              </>
            )}
          </div>
        </Reveal>
      </Container>
    </section>

    <section className="section cta">
      <Container>
        <Reveal>
          <p className="eyebrow" style={{ color: '#fff' }}>Stay connected</p>
          <h2 className="heading">There is a place for you here.</h2>
          <p>Explore the parish, find a service, or get in touch.</p>
          <div className="actions">
            <Link className="button button--light" to="/contact">Contact the parish <span aria-hidden="true">↗</span></Link>
          </div>
        </Reveal>
      </Container>
    </section>
  </>
}
