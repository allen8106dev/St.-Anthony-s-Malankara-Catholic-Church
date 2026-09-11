import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react'
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
  const churchAddress = s.address || 'Address to be confirmed'
  const churchPhone = s.phone || null
  const churchEmail = s.email || null
  const [heroPaused, setHeroPaused] = useState(false)

  const upcomingEvents = eventsData?.items ?? []

  // Collect images from all albums (most recently added first) and take 3
  const allGalleryImages = (galleryData?.items ?? []).flatMap(album => album.images)
  const previewImages = allGalleryImages.slice(0, 3)

  // Motion refs and scroll tracking
  const heroStageRef = useRef<HTMLDivElement>(null)
  const heroViewportRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // Track the scroll of the initial hero viewport (from 0 to 1 as hero scrolls out)
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroViewportRef,
    offset: ['start start', 'end start'],
  })

  // Buttery-smooth spring damping for cinematic fluidity
  const smoothHeroProgress = useSpring(heroScrollProgress, {
    stiffness: 100,
    damping: 28,
    restDelta: 0.001,
  })

  // Hero text animation values on scroll:
  // - Lifts gently upward
  // - Fades smoothly to 0 by ~45% of viewport scroll
  // - Slightly scales down and gains a subtle soft blur
  const textOpacity = useTransform(smoothHeroProgress, [0, 0.45], [1, 0])
  const textY = useTransform(smoothHeroProgress, [0, 0.55], [0, -80])
  const textScale = useTransform(smoothHeroProgress, [0, 0.55], [1, 0.94])
  const textFilter = useTransform(smoothHeroProgress, [0, 0.45], ['blur(0px)', 'blur(7px)'])

  // Scroll prompt button fades out rapidly upon any scroll
  const scrollPromptOpacity = useTransform(smoothHeroProgress, [0, 0.12], [1, 0])

  // Backdrop scrim gently deepens as content sheet approaches
  const backdropScrimOpacity = useTransform(smoothHeroProgress, [0, 0.7], [0.15, 0.6])

  // Initial Load / Opening Entrance Choreography
  const easeOutExpo = [0.16, 1, 0.3, 1] as const

  const backdropAnim = reduced
    ? {}
    : {
        initial: { scale: 1.08, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 1.3, ease: easeOutExpo },
      }

  const eyebrowAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: -16, letterSpacing: '0.08em' },
        animate: { opacity: 1, y: 0, letterSpacing: '0.14em' },
        transition: { duration: 0.85, delay: 0.15, ease: easeOutExpo },
      }

  const headingLine1Anim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 38, filter: 'blur(6px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        transition: { duration: 0.95, delay: 0.28, ease: easeOutExpo },
      }

  const headingLine2Anim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 38, filter: 'blur(6px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        transition: { duration: 0.95, delay: 0.42, ease: easeOutExpo },
      }

  const ledeAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.85, delay: 0.58, ease: easeOutExpo },
      }

  const actionsAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, delay: 0.75, ease: easeOutExpo },
      }

  const promptAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.75, delay: 1.0, ease: easeOutExpo },
      }

  return (
    <>
      <div ref={heroStageRef} className="hero-scroll-stage">
        {/* Sticky Hero Backdrop (remains pinned behind the page content) */}
        <motion.div className="hero-backdrop-sticky" {...backdropAnim}>
          <HeroSlideshow
            slides={heroImages ?? []}
            fallbackSrc={demoImages.sanctuary.src}
            paused={heroPaused}
            onPauseChange={() => setHeroPaused(value => !value)}
          />
          <div className="hero__art" aria-hidden="true" />
          <motion.div
            className="hero-backdrop-scrim"
            aria-hidden="true"
            style={reduced ? undefined : { opacity: backdropScrimOpacity }}
          />
        </motion.div>

        {/* Foreground Content */}
        <div className="hero-foreground-content">
          {/* First viewport: hero text that animates out smoothly as you scroll */}
          <div ref={heroViewportRef} className="hero-intro-viewport">
            <Container className="hero__content">
              <motion.div
                className="hero-text-anim-wrap"
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: textOpacity,
                        y: textY,
                        scale: textScale,
                        filter: textFilter,
                      }
                }
              >
                <motion.p className="eyebrow" {...eyebrowAnim}>
                  Welcome to our parish family
                </motion.p>
                <h1 className="display">
                  <motion.span style={{ display: 'block' }} {...headingLine1Anim}>
                    Faith, fellowship,
                  </motion.span>
                  <motion.span style={{ display: 'block' }} {...headingLine2Anim}>
                    and a place to call home.
                  </motion.span>
                </h1>
                <motion.p className="lede" {...ledeAnim}>
                  {`Join ${churchName} for prayer, worship, and the shared life of our parish community.`}
                </motion.p>
                <motion.div className="actions" {...actionsAnim}>
                  <Link className="button button--light" to="/about">
                    Discover our parish <span aria-hidden="true">↗</span>
                  </Link>
                  <Link
                    className="button button--outline"
                    to="/liturgy"
                    style={{ color: '#fff', borderColor: 'rgba(255, 255, 255, 0.35)' }}
                  >
                    Liturgy & Tradition
                  </Link>
                </motion.div>
              </motion.div>
            </Container>

            <motion.button
              type="button"
              className="hero-scroll-indicator"
              onClick={() => {
                document.getElementById('welcome-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              aria-label="Scroll down to explore parish content"
              {...promptAnim}
              style={reduced ? undefined : { opacity: scrollPromptOpacity }}
            >
              <span className="hero-scroll-indicator__mouse" aria-hidden="true">
                <span className="hero-scroll-indicator__wheel" />
              </span>
              <span>Scroll to explore</span>
            </motion.button>
          </div>

          {/* Elevated Content Sheet that glides up OVER the pinned hero backdrop */}
          <div id="welcome-section" className="homepage-content-sheet">
            <section className="section">
              <Container className="intro-grid">
                <Reveal>
                  <p className="eyebrow">Welcome</p>
                  <h2 className="heading">A community shaped by prayer and presence.</h2>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="lede">
                    St. Anthony's Malankara Catholic Church is a vibrant parish family dedicated to the traditions of the West Syriac liturgy, spiritual growth, and joyful fellowship.
                  </p>
                  <Link className="text-link" to="/about">
                    Learn about our parish <span aria-hidden="true">→</span>
                  </Link>
                </Reveal>
              </Container>
            </section>

            <div className="marquee" aria-label="Welcome to the parish">
              <div className="marquee__track">
                <span>Welcome to our parish</span>
                <span aria-hidden="true">✦</span>
                <span>Prayer · Community · Belonging</span>
                <span aria-hidden="true">✦</span>
                <span>Welcome to our parish</span>
                <span aria-hidden="true">✦</span>
              </div>
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
                  <Link className="text-link" to="/events">
                    View all events <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="event-grid event-grid--track">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event, index) => (
                      <Reveal key={event.id} delay={index * 0.07}>
                        <article className="event">
                          <span className="event__date">
                            {new Date(event.start_datetime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <h3>{event.title}</h3>
                          <p>{event.description ?? ''}</p>
                          <Link className="text-link" to="/events">
                            Details <span aria-hidden="true">→</span>
                          </Link>
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
                  <Link className="text-link" to="/ministries">
                    Explore ministries <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="ministry-grid">
                  {ministryPreviews.map((ministry, index) => (
                    <Reveal key={ministry.number} delay={index * 0.07}>
                      <article className="ministry">
                        <span>{ministry.number}</span>
                        <h3>
                          <Link
                            to={`/ministries/${ministry.id}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {ministry.title}
                          </Link>
                        </h3>
                        <p>{ministry.detail}</p>
                        <div style={{ marginTop: '0.8rem' }}>
                          <Link to={`/ministries/${ministry.id}`} className="text-link">
                            View ministry <span aria-hidden="true">→</span>
                          </Link>
                        </div>
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
                  <Link className="text-link" to="/gallery">
                    View gallery <span aria-hidden="true">→</span>
                  </Link>
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
          </div>
        </div>
      </div>

      {/* Contact Bit: positioned OUTSIDE .hero-scroll-stage */}
      {/* As user scrolls past the hero stage, the hero backdrop naturally unpins and scrolls away */}
      <section id="contact" className="homepage-contact-section">
        <Container>
          <Reveal>
            <div className="homepage-contact-card">
              <div>
                <p className="eyebrow" style={{ color: 'var(--accent-soft)' }}>
                  Visit & Connect
                </p>
                <h2 className="heading" style={{ color: '#fff' }}>
                  There is a place for you here.
                </h2>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    margin: '1.2rem 0 2rem',
                    lineHeight: 1.65,
                  }}
                >
                  Whether you are visiting for the first time, seeking prayer, or looking for a parish home, we warmly welcome you.
                </p>
                <div className="actions">
                  <Link className="button button--light" to="/contact">
                    Plan your visit <span aria-hidden="true">↗</span>
                  </Link>
                  <Link
                    className="button button--outline"
                    to="/liturgy"
                    style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    Liturgy & Traditions
                  </Link>
                </div>
              </div>
              <div className="homepage-contact-info">
                <div className="homepage-contact-item">
                  <h4>Parish Sanctuary</h4>
                  <p>{churchAddress}</p>
                </div>
                <div className="homepage-contact-item">
                  <h4>Holy Qurbana & Worship</h4>
                  <p>
                    Sundays: Morning Prayer & Holy Qurbana<br />
                    Feast days & special liturgies as scheduled
                  </p>
                </div>
                <div className="homepage-contact-item">
                  <h4>Get in Touch</h4>
                  <p>
                    {churchEmail && (
                      <>
                        <a href={`mailto:${churchEmail}`} style={{ color: '#fff', textDecoration: 'underline' }}>
                          {churchEmail}
                        </a>
                        <br />
                      </>
                    )}
                    {churchPhone && (
                      <a href={`tel:${churchPhone.replace(/\s+/g, '')}`} style={{ color: '#fff' }}>
                        {churchPhone}
                      </a>
                    )}
                    {!churchEmail && !churchPhone && 'Connect with our parish via our contact form.'}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
