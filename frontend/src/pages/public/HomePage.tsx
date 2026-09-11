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

  // Single stage ref for the continuous scroll storytelling canvas
  const stageRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // Track the continuous scroll progress of the entire stage from 0 to 1
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })

  // Buttery-smooth spring interpolation for fluid gliding transitions
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 65,
    damping: 22,
    restDelta: 0.0005,
  })

  // --------------------------------------------------------------------------
  // BACKGROUND CROSSFADES (Stacked layers with scroll-driven opacity)
  // Layer 0: Hero Slideshow (Base, always opacity 1)
  // Layer 1: Ministries Image
  const ministriesBgOpacity = useTransform(smoothProgress, [0.10, 0.20], [0, 1])
  // Layer 2: Events Image
  const eventsBgOpacity = useTransform(smoothProgress, [0.32, 0.42], [0, 1])
  // Layer 3: Gallery Image
  const galleryBgOpacity = useTransform(smoothProgress, [0.54, 0.64], [0, 1])
  // Layer 4: Contact Image
  const contactBgOpacity = useTransform(smoothProgress, [0.76, 0.86], [0, 1])

  // --------------------------------------------------------------------------
  // CHAPTER 0: HERO (Entrance choreography on load, then smooth scroll fade-out)
  const heroOpacity = useTransform(smoothProgress, [0.08, 0.18], [1, 0])
  const heroY = useTransform(smoothProgress, [0.08, 0.18], [0, -60])
  const heroPromptOpacity = useTransform(smoothProgress, [0, 0.04], [1, 0])
  const heroPointer = useTransform(smoothProgress, v => (v <= 0.14 ? 'auto' : 'none'))

  // --------------------------------------------------------------------------
  // CHAPTER 1: MINISTRIES (First 3 on PC, explore button, smooth in & out)
  const ministriesOpacity = useTransform(smoothProgress, [0.12, 0.20, 0.34, 0.40], [0, 1, 1, 0])
  const ministriesY = useTransform(smoothProgress, [0.12, 0.20, 0.34, 0.40], [50, 0, 0, -50])
  const ministriesPointer = useTransform(smoothProgress, v => (v >= 0.14 && v <= 0.38 ? 'auto' : 'none'))

  // --------------------------------------------------------------------------
  // CHAPTER 2: EVENTS (Upcoming events cards, smooth in & out)
  const eventsOpacity = useTransform(smoothProgress, [0.34, 0.42, 0.56, 0.62], [0, 1, 1, 0])
  const eventsY = useTransform(smoothProgress, [0.34, 0.42, 0.56, 0.62], [50, 0, 0, -50])
  const eventsPointer = useTransform(smoothProgress, v => (v >= 0.36 && v <= 0.60 ? 'auto' : 'none'))

  // --------------------------------------------------------------------------
  // CHAPTER 3: GALLERY (3 Preview photos, smooth in & out)
  const galleryOpacity = useTransform(smoothProgress, [0.56, 0.64, 0.78, 0.84], [0, 1, 1, 0])
  const galleryY = useTransform(smoothProgress, [0.56, 0.64, 0.78, 0.84], [50, 0, 0, -50])
  const galleryPointer = useTransform(smoothProgress, v => (v >= 0.58 && v <= 0.82 ? 'auto' : 'none'))

  // --------------------------------------------------------------------------
  // CHAPTER 4: CONTACT (Parish info & visit actions, settles into place)
  const contactOpacity = useTransform(smoothProgress, [0.78, 0.88], [0, 1])
  const contactY = useTransform(smoothProgress, [0.78, 0.88], [50, 0])
  const contactPointer = useTransform(smoothProgress, v => (v >= 0.80 ? 'auto' : 'none'))

  // Initial Load Choreography for Hero Chapter
  const easeOutExpo = [0.16, 1, 0.3, 1] as const

  const eyebrowAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: -16, letterSpacing: '0.08em' },
        animate: { opacity: 1, y: 0, letterSpacing: '0.16em' },
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
    <div ref={stageRef} className="hp-stage">
      {/* ====================================================================
          PINNED FULL-VIEWPORT BACKDROP
          Stays sticky and never scrolls with the page content.
          Layers stacked with z-index crossfade seamlessly as user scrolls.
          ==================================================================== */}
      <div className="hp-backdrop-sticky" aria-hidden="true">
        {/* Layer 0: Hero Slideshow / Sanctuary (Base) */}
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
          CONTINUOUS FOREGROUND STICKY VIEWPORT
          Single pinned container: zero unpinning glitches, perfectly smooth
          GPU-accelerated storytelling transitions across all 5 chapters.
          ==================================================================== */}
      <div className="hp-foreground-sticky">
        {/* ---------------- CHAPTER 0: HERO ---------------- */}
        <motion.div
          className="hp-panel hp-panel--hero"
          style={
            reduced
              ? undefined
              : {
                  opacity: heroOpacity,
                  y: heroY,
                  pointerEvents: heroPointer,
                }
          }
        >
          <Container className="hero__content">
            <div className="hero-text-anim-wrap">
              <motion.p className="hp-hero-eyebrow" {...eyebrowAnim}>
                Welcome to our parish family
              </motion.p>
              <h1 className="hp-hero-display">
                <motion.span style={{ display: 'block' }} {...headingLine1Anim}>
                  Faith, fellowship,
                </motion.span>
                <motion.span style={{ display: 'block' }} {...headingLine2Anim}>
                  and a place to call home.
                </motion.span>
              </h1>
              <motion.p className="hp-hero-lede" {...ledeAnim}>
                {`Join ${churchName} for prayer, worship, and the shared life of our parish community.`}
              </motion.p>
              <motion.div className="actions" {...actionsAnim}>
                <Link className="button button--light" to="/about">
                  Discover our parish <span aria-hidden="true">↗</span>
                </Link>
                <Link
                  className="button button--outline"
                  to="/liturgy"
                  style={{ color: '#fff', borderColor: 'rgba(255, 255, 255, 0.45)' }}
                >
                  Liturgy & Tradition
                </Link>
              </motion.div>
            </div>
          </Container>

          <motion.button
            type="button"
            className="hero-scroll-indicator"
            onClick={() => {
              window.scrollTo({ top: window.innerHeight * 1.15, behavior: 'smooth' })
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
        </motion.div>

        {/* ---------------- CHAPTER 1: MINISTRIES ---------------- */}
        <motion.div
          className="hp-panel"
          style={
            reduced
              ? undefined
              : {
                  opacity: ministriesOpacity,
                  y: ministriesY,
                  pointerEvents: ministriesPointer,
                }
          }
        >
          <Container>
            <div className="hp-content-card">
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
            </div>
          </Container>
        </motion.div>

        {/* ---------------- CHAPTER 2: EVENTS ---------------- */}
        <motion.div
          className="hp-panel"
          style={
            reduced
              ? undefined
              : {
                  opacity: eventsOpacity,
                  y: eventsY,
                  pointerEvents: eventsPointer,
                }
          }
        >
          <Container>
            <div className="hp-content-card">
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
            </div>
          </Container>
        </motion.div>

        {/* ---------------- CHAPTER 3: GALLERY ---------------- */}
        <motion.div
          className="hp-panel"
          style={
            reduced
              ? undefined
              : {
                  opacity: galleryOpacity,
                  y: galleryY,
                  pointerEvents: galleryPointer,
                }
          }
        >
          <Container>
            <div className="hp-content-card">
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
            </div>
          </Container>
        </motion.div>

        {/* ---------------- CHAPTER 4: CONTACT ---------------- */}
        <motion.div
          className="hp-panel"
          style={
            reduced
              ? undefined
              : {
                  opacity: contactOpacity,
                  y: contactY,
                  pointerEvents: contactPointer,
                }
          }
        >
          <Container>
            <div className="hp-contact-box">
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
                    style={{ color: '#fff', borderColor: 'rgba(255, 255, 255, 0.45)' }}
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
            </div>
          </Container>
        </motion.div>
      </div>
    </div>
  )
}
