import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react'
import { Container } from '../../components/ui/Container'
import { HeroSlideshow } from '../../components/public/HeroSlideshow'
import { usePublicEvents, usePublicSettings, usePublicGallery, usePublicHeroImages } from '../../hooks/usePublicContent'
import { demoImages, ministryPreviews, ministries, siteName } from '../../data/siteContent'

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

  // Collect preview images from albums or fallbacks
  const allGalleryImages = (galleryData?.items ?? []).flatMap(album => album.images)
  const previewImages = allGalleryImages.slice(0, 3)

  // Chapter container refs
  const heroRef = useRef<HTMLDivElement>(null)
  const ministriesRef = useRef<HTMLDivElement>(null)
  const eventsRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  const reduced = useReducedMotion()

  // Spring options for cinematic fluidity
  const springConfig = { stiffness: 95, damping: 26, restDelta: 0.001 }

  // 1. Hero Scroll Tracking
  const { scrollYProgress: rawHeroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroProgress = useSpring(rawHeroProgress, springConfig)
  const heroTextOpacity = useTransform(heroProgress, [0.05, 0.55], [1, 0])
  const heroTextY = useTransform(heroProgress, [0.05, 0.55], [0, -60])
  const heroPromptOpacity = useTransform(heroProgress, [0, 0.15], [1, 0])

  // 2. Ministries Scroll Tracking
  const { scrollYProgress: rawMinistriesProgress } = useScroll({
    target: ministriesRef,
    offset: ['start end', 'end start'],
  })
  const ministriesProgress = useSpring(rawMinistriesProgress, springConfig)
  const ministriesBgOpacity = useTransform(ministriesProgress, [0.15, 0.35], [0, 1])
  const ministriesContentOpacity = useTransform(ministriesProgress, [0.15, 0.35, 0.68, 0.88], [0, 1, 1, 0])
  const ministriesContentY = useTransform(ministriesProgress, [0.15, 0.35, 0.68, 0.88], [50, 0, 0, -50])

  // 3. Events Scroll Tracking
  const { scrollYProgress: rawEventsProgress } = useScroll({
    target: eventsRef,
    offset: ['start end', 'end start'],
  })
  const eventsProgress = useSpring(rawEventsProgress, springConfig)
  const eventsBgOpacity = useTransform(eventsProgress, [0.15, 0.35], [0, 1])
  const eventsContentOpacity = useTransform(eventsProgress, [0.15, 0.35, 0.68, 0.88], [0, 1, 1, 0])
  const eventsContentY = useTransform(eventsProgress, [0.15, 0.35, 0.68, 0.88], [50, 0, 0, -50])

  // 4. Gallery Scroll Tracking
  const { scrollYProgress: rawGalleryProgress } = useScroll({
    target: galleryRef,
    offset: ['start end', 'end start'],
  })
  const galleryProgress = useSpring(rawGalleryProgress, springConfig)
  const galleryBgOpacity = useTransform(galleryProgress, [0.15, 0.35], [0, 1])
  const galleryContentOpacity = useTransform(galleryProgress, [0.15, 0.35, 0.68, 0.88], [0, 1, 1, 0])
  const galleryContentY = useTransform(galleryProgress, [0.15, 0.35, 0.68, 0.88], [50, 0, 0, -50])

  // 5. Contact Scroll Tracking
  const { scrollYProgress: rawContactProgress } = useScroll({
    target: contactRef,
    offset: ['start end', 'end start'],
  })
  const contactProgress = useSpring(rawContactProgress, springConfig)
  const contactBgOpacity = useTransform(contactProgress, [0.15, 0.35], [0, 1])
  const contactContentOpacity = useTransform(contactProgress, [0.15, 0.35, 0.85, 1.0], [0, 1, 1, 0])
  const contactContentY = useTransform(contactProgress, [0.15, 0.35, 0.85, 1.0], [50, 0, 0, -30])

  // Initial Load Choreography for Hero Chapter
  const easeOutExpo = [0.16, 1, 0.3, 1] as const

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
    <div className="hp-stage">
      {/* ====================================================================
          PINNED FULL-VIEWPORT BACKDROP
          Stays sticky and never scrolls with the page content.
          Layers stacked with z-index crossfade seamlessly as user scrolls.
          ==================================================================== */}
      <div className="hp-backdrop-sticky" aria-hidden="true">
        {/* Layer 0: Hero Slideshow / Sanctuary */}
        <div className="hp-backdrop-layer hp-backdrop-layer--0">
          <HeroSlideshow
            slides={heroImages ?? []}
            fallbackSrc={demoImages.sanctuary.src}
            paused={heroPaused}
            onPauseChange={() => setHeroPaused(value => !value)}
          />
        </div>

        {/* Layer 1: Ministries Background */}
        <motion.div
          className="hp-backdrop-layer hp-backdrop-layer--1"
          style={{ opacity: reduced ? 1 : ministriesBgOpacity }}
        >
          <img
            src={ministries[0]?.image?.src || demoImages.community.src}
            alt="Parish ministries in fellowship"
            className="hp-backdrop-img"
          />
        </motion.div>

        {/* Layer 2: Events Background */}
        <motion.div
          className="hp-backdrop-layer hp-backdrop-layer--2"
          style={{ opacity: reduced ? 1 : eventsBgOpacity }}
        >
          <img
            src={demoImages.gathering.src}
            alt="Parish gathering and events"
            className="hp-backdrop-img"
          />
        </motion.div>

        {/* Layer 3: Gallery Background */}
        <motion.div
          className="hp-backdrop-layer hp-backdrop-layer--3"
          style={{ opacity: reduced ? 1 : galleryBgOpacity }}
        >
          <img
            src={demoImages.prayer.src}
            alt="Parish sacred space and prayer"
            className="hp-backdrop-img"
          />
        </motion.div>

        {/* Layer 4: Contact Background */}
        <motion.div
          className="hp-backdrop-layer hp-backdrop-layer--4"
          style={{ opacity: reduced ? 1 : contactBgOpacity }}
        >
          <img
            src={demoImages.architecture.src}
            alt="Parish sanctuary and grounds"
            className="hp-backdrop-img"
          />
        </motion.div>

        {/* Cinematic Scrim & Subtle Art Grid */}
        <div className="hero__art" aria-hidden="true" />
        <div className="hp-backdrop-scrim" aria-hidden="true" />
      </div>

      {/* ====================================================================
          FOREGROUND CHAPTERS
          Scrolls in front of the pinned background.
          Each chapter pins in viewport, reveals content, then glides away.
          ==================================================================== */}
      <div className="hp-chapters-flow">
        {/* ---------------- CHAPTER 1: HERO ---------------- */}
        <section ref={heroRef} className="hp-chapter hp-chapter--hero">
          <div className="hp-chapter-pin">
            <Container className="hero__content">
              <motion.div
                className="hero-text-anim-wrap"
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: heroTextOpacity,
                        y: heroTextY,
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
                ministriesRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}
              aria-label="Scroll down to explore parish content"
              {...promptAnim}
              style={reduced ? undefined : { opacity: heroPromptOpacity }}
            >
              <span className="hero-scroll-indicator__mouse" aria-hidden="true">
                <span className="hero-scroll-indicator__wheel" />
              </span>
              <span>Scroll to explore</span>
            </motion.button>
          </div>
        </section>

        {/* ---------------- CHAPTER 2: MINISTRIES ---------------- */}
        <section ref={ministriesRef} className="hp-chapter">
          <div className="hp-chapter-pin">
            <Container>
              <motion.div
                className="hp-content-card"
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: ministriesContentOpacity,
                        y: ministriesContentY,
                      }
                }
              >
                <div className="hp-section-head">
                  <div>
                    <p className="eyebrow hp-eyebrow">Parish Life</p>
                    <h2 className="heading hp-heading">Many ways to grow together.</h2>
                  </div>
                  <Link className="button button--light" to="/ministries">
                    Explore ministries <span aria-hidden="true">→</span>
                  </Link>
                </div>

                <div className="hp-grid-3">
                  {ministryPreviews.slice(0, 3).map(ministry => (
                    <article key={ministry.id} className="hp-card">
                      <span className="hp-card-num">{ministry.number}</span>
                      <h3 className="hp-card-title">
                        <Link
                          to={`/ministries/${ministry.id}`}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {ministry.title}
                        </Link>
                      </h3>
                      <p className="hp-card-detail">{ministry.detail}</p>
                      <div>
                        <Link to={`/ministries/${ministry.id}`} className="hp-card-link">
                          View ministry <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </motion.div>
            </Container>
          </div>
        </section>

        {/* ---------------- CHAPTER 3: EVENTS ---------------- */}
        <section ref={eventsRef} className="hp-chapter">
          <div className="hp-chapter-pin">
            <Container>
              <motion.div
                className="hp-content-card"
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: eventsContentOpacity,
                        y: eventsContentY,
                      }
                }
              >
                <div className="hp-section-head">
                  <div>
                    <p className="eyebrow hp-eyebrow">What's Ahead</p>
                    <h2 className="heading hp-heading">Gatherings to look forward to.</h2>
                  </div>
                  <Link className="button button--light" to="/events">
                    View all events <span aria-hidden="true">→</span>
                  </Link>
                </div>

                <div className="hp-grid-3">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.slice(0, 3).map(event => (
                      <article key={event.id} className="hp-card">
                        <span className="hp-card-badge">
                          {new Date(event.start_datetime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <h3 className="hp-card-title">{event.title}</h3>
                        <p className="hp-card-detail">{event.description || 'Join us for this parish event.'}</p>
                        <Link to="/events" className="hp-card-link">
                          Details <span aria-hidden="true">→</span>
                        </Link>
                      </article>
                    ))
                  ) : (
                    <article className="hp-card" style={{ gridColumn: 'span 3' }}>
                      <span className="hp-card-badge">Upcoming</span>
                      <h3 className="hp-card-title">Parish Gatherings & Celebrations</h3>
                      <p className="hp-card-detail">
                        Check back soon for upcoming Holy Qurbana feasts, youth activities, and parish events.
                      </p>
                      <Link to="/events" className="hp-card-link">
                        Explore Events Calendar <span aria-hidden="true">→</span>
                      </Link>
                    </article>
                  )}
                </div>
              </motion.div>
            </Container>
          </div>
        </section>

        {/* ---------------- CHAPTER 4: GALLERY ---------------- */}
        <section ref={galleryRef} className="hp-chapter">
          <div className="hp-chapter-pin">
            <Container>
              <motion.div
                className="hp-content-card"
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: galleryContentOpacity,
                        y: galleryContentY,
                      }
                }
              >
                <div className="hp-section-head">
                  <div>
                    <p className="eyebrow hp-eyebrow">Our Community</p>
                    <h2 className="heading hp-heading">The beauty of being together.</h2>
                  </div>
                  <Link className="button button--light" to="/gallery">
                    View gallery <span aria-hidden="true">→</span>
                  </Link>
                </div>

                <div className="hp-gallery-grid">
                  {previewImages.length > 0 ? (
                    previewImages.slice(0, 3).map(img => (
                      <div key={img.id} className="hp-gallery-card">
                        <img src={img.image_url} alt={img.alt_text} loading="lazy" />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="hp-gallery-card">
                        <img src={demoImages.sanctuary.src} alt={demoImages.sanctuary.alt} loading="lazy" />
                      </div>
                      <div className="hp-gallery-card">
                        <img src={demoImages.prayer.src} alt={demoImages.prayer.alt} loading="lazy" />
                      </div>
                      <div className="hp-gallery-card">
                        <img src={demoImages.community.src} alt={demoImages.community.alt} loading="lazy" />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </Container>
          </div>
        </section>

        {/* ---------------- CHAPTER 5: CONTACT ---------------- */}
        <section ref={contactRef} className="hp-chapter">
          <div className="hp-chapter-pin">
            <Container>
              <motion.div
                className="hp-contact-box"
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: contactContentOpacity,
                        y: contactContentY,
                      }
                }
              >
                <div>
                  <p className="eyebrow hp-eyebrow">Visit & Connect</p>
                  <h2 className="heading hp-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)' }}>
                    There is a place for you here.
                  </h2>
                  <p className="hp-contact-desc">
                    Whether you are visiting for the first time, seeking prayer, or looking for a parish home, we warmly welcome you to join our family.
                  </p>
                  <div className="actions" style={{ marginTop: '1.75rem' }}>
                    <Link className="button button--light" to="/contact">
                      Plan your visit <span aria-hidden="true">↗</span>
                    </Link>
                    <Link
                      className="button button--outline"
                      to="/liturgy"
                      style={{ color: '#fff', borderColor: 'rgba(255, 255, 255, 0.4)' }}
                    >
                      Liturgy & Traditions
                    </Link>
                  </div>
                </div>

                <div className="hp-contact-details">
                  <div className="hp-contact-item">
                    <h4>Parish Sanctuary</h4>
                    <p>{churchAddress}</p>
                  </div>
                  <div className="hp-contact-item">
                    <h4>Holy Qurbana & Worship</h4>
                    <p>
                      Sundays: Morning Prayer & Holy Qurbana<br />
                      Feast days & special liturgies as scheduled
                    </p>
                  </div>
                  <div className="hp-contact-item">
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
              </motion.div>
            </Container>
          </div>
        </section>
      </div>
    </div>
  )
}
