import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useReducedMotion, type MotionValue } from 'motion/react'
import { Container } from '../../components/ui/Container'
import { HeroSlideshow } from '../../components/public/HeroSlideshow'
import { usePublicEvents, usePublicSettings, usePublicGallery, usePublicHeroImages } from '../../hooks/usePublicContent'
import { demoImages, ministryPreviews, ministries, siteName } from '../../data/siteContent'

function useStaggeredChapter(
  progress: MotionValue<number>,
  config: {
    enter: [number, number]
    exit: [number, number]
    itemCount?: number
  }
) {
  const { enter, exit, itemCount = 3 } = config
  const [inStart, inEnd] = enter
  const [outStart, outEnd] = exit
  const inDuration = inEnd - inStart
  const outDuration = outEnd - outStart

  // Header: leads entrance, leads exit
  const headInEnd = inStart + inDuration * 0.55
  const headOutEnd = outStart + outDuration * 0.55
  const headOpacity = useTransform(progress, [inStart, headInEnd, outStart, headOutEnd], [0, 1, 1, 0])
  const headY = useTransform(progress, [inStart, headInEnd, outStart, headOutEnd], [35, 0, 0, -35])
  const headScale = useTransform(progress, [inStart, headInEnd, outStart, headOutEnd], [0.96, 1, 1, 0.98])

  // Items: cascading wave entrance and exit
  const stepIn = (inDuration * 0.45) / Math.max(1, itemCount - 1)
  const stepOut = (outDuration * 0.45) / Math.max(1, itemCount - 1)

  const item0InStart = inStart + inDuration * 0.15
  const item0InEnd = item0InStart + inDuration * 0.50
  const item0OutStart = outStart + outDuration * 0.15
  const item0OutEnd = item0OutStart + outDuration * 0.50
  const item0Opacity = useTransform(progress, [item0InStart, item0InEnd, item0OutStart, item0OutEnd], [0, 1, 1, 0])
  const item0Y = useTransform(progress, [item0InStart, item0InEnd, item0OutStart, item0OutEnd], [48, 0, 0, -45])
  const item0Scale = useTransform(progress, [item0InStart, item0InEnd, item0OutStart, item0OutEnd], [0.93, 1, 1, 0.95])

  const item1InStart = item0InStart + stepIn
  const item1InEnd = item0InEnd + stepIn
  const item1OutStart = item0OutStart + stepOut
  const item1OutEnd = item0OutEnd + stepOut
  const item1Opacity = useTransform(progress, [item1InStart, item1InEnd, item1OutStart, item1OutEnd], [0, 1, 1, 0])
  const item1Y = useTransform(progress, [item1InStart, item1InEnd, item1OutStart, item1OutEnd], [48, 0, 0, -45])
  const item1Scale = useTransform(progress, [item1InStart, item1InEnd, item1OutStart, item1OutEnd], [0.93, 1, 1, 0.95])

  const item2InStart = item1InStart + stepIn
  const item2InEnd = item1InEnd + stepIn
  const item2OutStart = item1OutStart + stepOut
  const item2OutEnd = item1OutEnd + stepOut
  const item2Opacity = useTransform(progress, [item2InStart, item2InEnd, item2OutStart, item2OutEnd], [0, 1, 1, 0])
  const item2Y = useTransform(progress, [item2InStart, item2InEnd, item2OutStart, item2OutEnd], [48, 0, 0, -45])
  const item2Scale = useTransform(progress, [item2InStart, item2InEnd, item2OutStart, item2OutEnd], [0.93, 1, 1, 0.95])

  const pointer = useTransform(
    progress,
    v => (v >= inStart + inDuration * 0.25 && v <= outStart + outDuration * 0.85 ? 'auto' : 'none')
  )

  return {
    head: { opacity: headOpacity, y: headY, scale: headScale },
    items: [
      { opacity: item0Opacity, y: item0Y, scale: item0Scale },
      { opacity: item1Opacity, y: item1Y, scale: item1Scale },
      { opacity: item2Opacity, y: item2Y, scale: item2Scale },
    ],
    pointer,
  }
}

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

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 760px)').matches : false
  )

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 760px)')
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Buttery-smooth spring interpolation for fluid gliding transitions
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 65,
    damping: 22,
    restDelta: 0.0005,
  })


  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // BACKGROUND CINEMATIC TRANSITIONS (3D Camera Push, Zoom & Rack-Focus Dissolve)
  // Layer 0: Hero Slideshow (Base)
  const heroBgScale = useTransform(smoothProgress, [0.12, 0.17], [1.00, 1.06])
  const heroBgY = useTransform(smoothProgress, [0.12, 0.17], [0, -20])

  // Layer 1: Ministries Image
  const ministriesBgOpacity = useTransform(smoothProgress, [0.12, 0.17], [0, 1])
  const ministriesBgScale = useTransform(
    smoothProgress,
    [0.12, 0.17, 0.39, 0.44],
    [1.10, 1.02, 1.02, 1.07]
  )
  const ministriesBgY = useTransform(
    smoothProgress,
    [0.12, 0.17, 0.39, 0.44],
    [28, 0, 0, -20]
  )
  const ministriesBgBlur = useTransform(
    smoothProgress,
    [0.12, 0.165],
    ['blur(5px)', 'blur(0px)']
  )

  // Layer 2: Events Image
  const eventsBgOpacity = useTransform(smoothProgress, [0.39, 0.44], [0, 1])
  const eventsBgScale = useTransform(
    smoothProgress,
    [0.39, 0.44, 0.65, 0.70],
    [1.10, 1.02, 1.02, 1.07]
  )
  const eventsBgY = useTransform(
    smoothProgress,
    [0.39, 0.44, 0.65, 0.70],
    [28, 0, 0, -20]
  )
  const eventsBgBlur = useTransform(
    smoothProgress,
    [0.39, 0.435],
    ['blur(5px)', 'blur(0px)']
  )

  // Layer 3: Gallery Image
  const galleryBgOpacity = useTransform(smoothProgress, [0.65, 0.70], [0, 1])
  const galleryBgScale = useTransform(
    smoothProgress,
    [0.65, 0.70, 0.90, 0.94],
    [1.10, 1.02, 1.02, 1.07]
  )
  const galleryBgY = useTransform(
    smoothProgress,
    [0.65, 0.70, 0.90, 0.94],
    [28, 0, 0, -20]
  )
  const galleryBgBlur = useTransform(
    smoothProgress,
    [0.65, 0.695],
    ['blur(5px)', 'blur(0px)']
  )

  // Layer 4: Contact Image
  const contactBgOpacity = useTransform(smoothProgress, [0.90, 0.94], [0, 1])
  const contactBgScale = useTransform(smoothProgress, [0.90, 0.94], [1.10, 1.02])
  const contactBgY = useTransform(smoothProgress, [0.90, 0.94], [28, 0])
  const contactBgBlur = useTransform(
    smoothProgress,
    [0.90, 0.935],
    ['blur(5px)', 'blur(0px)']
  )

  // Atmospheric Light Bloom during background crossfades
  const transitionGlowOpacity = useTransform(
    smoothProgress,
    [0, 0.12, 0.145, 0.17, 0.39, 0.415, 0.44, 0.65, 0.675, 0.70, 0.90, 0.920, 0.94, 1.0],
    [0, 0, 0.28, 0, 0, 0.28, 0, 0, 0.28, 0, 0, 0.28, 0, 0]
  )

  // Dynamic Scrim (drops to 0 when background is solo/crossfading, so images are completely clear and undimmed)
  const scrimOpacity = useTransform(
    smoothProgress,
    [0, 0.03, 0.08, 0.20, 0.25, 0.31, 0.37, 0.46, 0.51, 0.57, 0.63, 0.72, 0.77, 0.83, 0.89, 0.94, 0.98, 1.0],
    [0.58, 0.58, 0, 0, 0.62, 0.62, 0, 0, 0.62, 0.62, 0, 0, 0.62, 0.62, 0, 0, 0.58, 0.58]
  )

  // --------------------------------------------------------------------------
  // CHAPTER 0: HERO (Waterfall cascade dissolution on scroll)
  const heroPromptOpacity = useTransform(smoothProgress, [0, 0.025], [1, 0])
  const heroPromptScale = useTransform(smoothProgress, [0, 0.025], [1, 0.88])

  const heroEyebrowOpacity = useTransform(smoothProgress, [0.015, 0.045], [1, 0])
  const heroEyebrowY = useTransform(smoothProgress, [0.015, 0.045], [0, -25])

  const heroHeadingOpacity = useTransform(smoothProgress, [0.025, 0.060], [1, 0])
  const heroHeadingY = useTransform(smoothProgress, [0.025, 0.060], [0, -35])
  const heroHeadingScale = useTransform(smoothProgress, [0.025, 0.060], [1, 0.97])

  const heroLedeOpacity = useTransform(smoothProgress, [0.035, 0.070], [1, 0])
  const heroLedeY = useTransform(smoothProgress, [0.035, 0.070], [0, -30])

  const heroActionsOpacity = useTransform(smoothProgress, [0.045, 0.080], [1, 0])
  const heroActionsY = useTransform(smoothProgress, [0.045, 0.080], [0, -25])
  const heroActionsScale = useTransform(smoothProgress, [0.045, 0.080], [1, 0.95])

  const heroPointer = useTransform(smoothProgress, v => (v <= 0.05 ? 'auto' : 'none'))

  // --------------------------------------------------------------------------
  // CHAPTER 1: MINISTRIES (Cascading wave entrance & exit)
  const ministriesChapter = useStaggeredChapter(smoothProgress, {
    enter: [0.20, 0.26],
    exit: [0.31, 0.36],
  })

  // --------------------------------------------------------------------------
  // CHAPTER 2: EVENTS (Cascading wave entrance & exit)
  const eventsChapter = useStaggeredChapter(smoothProgress, {
    enter: [0.46, 0.52],
    exit: [0.57, 0.62],
  })

  // --------------------------------------------------------------------------
  // CHAPTER 3: GALLERY (Cascading photo entrance & exit)
  const galleryChapter = useStaggeredChapter(smoothProgress, {
    enter: [0.72, 0.78],
    exit: [0.83, 0.88],
  })

  // --------------------------------------------------------------------------
  // CHAPTER 4: CONTACT (Staggered two-column reveal, completely hidden before 0.92)
  const contactBoxOpacity = useTransform(smoothProgress, [0.93, 0.96], [0, 1])
  const contactBoxY = useTransform(smoothProgress, [0.93, 0.96], [40, 0])
  const contactBoxScale = useTransform(smoothProgress, [0.93, 0.96], [0.95, 1])
  const contactVisibility = useTransform(smoothProgress, v => (v >= 0.92 ? 'visible' : 'hidden'))

  const contactHeadOpacity = useTransform(smoothProgress, [0.94, 0.97], [0, 1])
  const contactHeadY = useTransform(smoothProgress, [0.94, 0.97], [30, 0])
  const contactHeadScale = useTransform(smoothProgress, [0.94, 0.97], [0.96, 1])

  const contactActionsOpacity = useTransform(smoothProgress, [0.95, 0.98], [0, 1])
  const contactActionsY = useTransform(smoothProgress, [0.95, 0.98], [20, 0])

  const contactItem0Opacity = useTransform(smoothProgress, [0.95, 0.98], [0, 1])
  const contactItem0Y = useTransform(smoothProgress, [0.95, 0.98], [30, 0])
  const contactItem0Scale = useTransform(smoothProgress, [0.95, 0.98], [0.94, 1])

  const contactItem1Opacity = useTransform(smoothProgress, [0.96, 0.99], [0, 1])
  const contactItem1Y = useTransform(smoothProgress, [0.96, 0.99], [30, 0])
  const contactItem1Scale = useTransform(smoothProgress, [0.96, 0.99], [0.94, 1])

  const contactItem2Opacity = useTransform(smoothProgress, [0.97, 1.00], [0, 1])
  const contactItem2Y = useTransform(smoothProgress, [0.97, 1.00], [30, 0])
  const contactItem2Scale = useTransform(smoothProgress, [0.97, 1.00], [0.94, 1])

  const contactPointer = useTransform(smoothProgress, v => (v >= 0.95 ? 'auto' : 'none'))

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

  // ─── Mobile: flat normal-scroll layout ───────────────────────────────────
  if (isMobile) {
    const heroImg = heroImages?.[0]?.image_url ?? demoImages.sanctuary.src
    return (
      <div className="hp-mobile">
        {/* Persistent pinned backdrop — stays fixed in view while content scrolls */}
        <div className="hp-mobile-backdrop" aria-hidden="true">
          <img src={heroImg} alt="" className="hp-mobile-backdrop-img" />
          <div className="hp-mobile-backdrop-scrim" />
        </div>

        {/* Hero — full viewport height, scrolls up naturally over backdrop */}
        <div className="hp-mobile-hero">
          <div className="hp-mobile-hero__content">
            <p className="hp-hero-eyebrow">Welcome to our parish family</p>
            <h1 className="hp-hero-display">
              Faith, fellowship,{' '}
              <span style={{ display: 'block' }}>and a place to call home.</span>
            </h1>
            <p className="hp-hero-lede">
              {`Join ${churchName} for prayer, worship, and the shared life of our parish community.`}
            </p>
            <div className="actions" style={{ marginTop: '1.5rem' }}>
              <Link className="button button--light" to="/about">
                Discover our parish <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Ministries */}
        <section className="hp-mobile-section">
          <Container>
            <div className="hp-section-head" style={{ marginBottom: '1.5rem' }}>
              <div>
                <p className="eyebrow hp-eyebrow">Parish Life</p>
                <h2 className="heading hp-heading">Many ways to grow together.</h2>
              </div>
              <Link className="button" to="/ministries">
                Explore ministries <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hp-grid-3">
              {ministryPreviews.slice(0, 3).map((ministry) => (
                <article key={ministry.id} className="hp-card">
                  <Link to={`/ministries/${ministry.id}`} className="hp-card-image-link" tabIndex={-1} aria-hidden="true">
                    <img className="hp-card-image" src={ministry.image.src} alt="" loading="lazy" />
                  </Link>
                  <span className="hp-card-num">{ministry.number}</span>
                  <h3 className="hp-card-title">
                    <Link to={`/ministries/${ministry.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
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
          </Container>
        </section>

        {/* Events */}
        <section className="hp-mobile-section">
          <Container>
            <div className="hp-section-head" style={{ marginBottom: '1.5rem' }}>
              <div>
                <p className="eyebrow hp-eyebrow">What's Ahead</p>
                <h2 className="heading hp-heading">Gatherings to look forward to.</h2>
              </div>
              <Link className="button" to="/events">
                View all events <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hp-grid-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 3).map((event) => (
                  <article key={event.id} className="hp-card">
                    <Link to="/events" className="hp-card-image-link" tabIndex={-1} aria-hidden="true">
                      <img
                        className="hp-card-image"
                        src={event.image_url || demoImages.gathering.src}
                        alt=""
                        loading="lazy"
                      />
                    </Link>
                    <span className="hp-card-badge">
                      {new Date(event.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <h3 className="hp-card-title">{event.title}</h3>
                    <p className="hp-card-detail">{event.description || 'Join us for this parish event.'}</p>
                    <Link to="/events" className="hp-card-link">Details <span aria-hidden="true">→</span></Link>
                  </article>
                ))
              ) : (
                <article className="hp-card" style={{ gridColumn: 'span 3' }}>
                  <span className="hp-card-badge">Upcoming</span>
                  <h3 className="hp-card-title">Parish Gatherings &amp; Celebrations</h3>
                  <p className="hp-card-detail">Check back soon for upcoming Holy Qurbana feasts, youth activities, and parish events.</p>
                  <Link to="/events" className="hp-card-link">Explore Events Calendar <span aria-hidden="true">→</span></Link>
                </article>
              )}
            </div>
          </Container>
        </section>

        {/* Gallery */}
        <section className="hp-mobile-section">
          <Container>
            <div className="hp-section-head" style={{ marginBottom: '1.5rem' }}>
              <div>
                <p className="eyebrow hp-eyebrow">Our Community</p>
                <h2 className="heading hp-heading">The beauty of being together.</h2>
              </div>
              <Link className="button" to="/gallery">
                View gallery <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hp-gallery-grid">
              {(previewImages.length > 0
                ? previewImages.slice(0, 3)
                : [demoImages.sanctuary, demoImages.prayer, demoImages.community].map(d => ({ id: d.src, image_url: d.src, alt_text: d.alt }))
              ).map((img) => (
                <div key={img.id} className="hp-gallery-card">
                  <img src={img.image_url} alt={img.alt_text} loading="lazy" />
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Contact */}
        <section className="hp-mobile-section hp-mobile-section--contact">
          <Container>
            <div className="hp-contact-box">
              <p className="eyebrow hp-eyebrow">Visit &amp; Connect</p>
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
              </div>
              <div className="hp-contact-details">
                <div className="hp-contact-item">
                  <h4>Parish Sanctuary</h4>
                  <p>{churchAddress}</p>
                </div>
                <div className="hp-contact-item">
                  <h4>Holy Qurbana &amp; Worship</h4>
                  <p>Sundays: Morning Prayer &amp; Holy Qurbana<br />Feast days &amp; special liturgies as scheduled</p>
                </div>
                {(churchEmail || churchPhone) && (
                  <div className="hp-contact-item">
                    <h4>Get in Touch</h4>
                    <p>
                      {churchEmail && <><a href={`mailto:${churchEmail}`} style={{ color: '#fff', textDecoration: 'underline' }}>{churchEmail}</a><br /></>}
                      {churchPhone && <a href={`tel:${churchPhone.replace(/\s+/g, '')}`} style={{ color: '#fff' }}>{churchPhone}</a>}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>
      </div>
    )
  }

  // ─── Desktop: cinematic parallax stage (unchanged) ────────────────────────
  return (
    <div ref={stageRef} className="hp-stage">
      {/* ====================================================================
          PINNED FULL-VIEWPORT BACKDROP
          Stays sticky and never scrolls with the page content.
          Layers stacked with z-index crossfade seamlessly as user scrolls.
          ==================================================================== */}

      <div className="hp-backdrop-sticky" aria-hidden="true">
        {/* Layer 0: Hero Slideshow / Sanctuary (Base) */}
        <motion.div
          className="hp-backdrop-layer hp-backdrop-layer--0"
          style={isMobile || reduced ? undefined : { scale: heroBgScale, y: heroBgY }}
        >
          <HeroSlideshow
            slides={heroImages ?? []}
            fallbackSrc={demoImages.sanctuary.src}
            paused={heroPaused}
            onPauseChange={() => setHeroPaused(value => !value)}
          />
        </motion.div>

        {/* Layer 1: Ministries Background */}
        <motion.div
          className="hp-backdrop-layer hp-backdrop-layer--1"
          style={
            reduced
              ? { opacity: 1 }
              : {
                  opacity: ministriesBgOpacity,
                  scale: ministriesBgScale,
                  y: ministriesBgY,
                  filter: ministriesBgBlur,
                }
          }
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
          style={
            reduced
              ? { opacity: 1 }
              : {
                  opacity: eventsBgOpacity,
                  scale: eventsBgScale,
                  y: eventsBgY,
                  filter: eventsBgBlur,
                }
          }
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
          style={
            reduced
              ? { opacity: 1 }
              : {
                  opacity: galleryBgOpacity,
                  scale: galleryBgScale,
                  y: galleryBgY,
                  filter: galleryBgBlur,
                }
          }
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
          style={
            reduced
              ? { opacity: 1 }
              : {
                  opacity: contactBgOpacity,
                  scale: contactBgScale,
                  y: contactBgY,
                  filter: contactBgBlur,
                }
          }
        >
          <img
            src={demoImages.architecture.src}
            alt="Parish sanctuary and grounds"
            className="hp-backdrop-img"
          />
        </motion.div>

        {/* Cinematic Atmospheric Light Bloom during background crossfades */}
        <motion.div
          className="hp-backdrop-glow"
          aria-hidden="true"
          style={{ opacity: reduced ? 0 : transitionGlowOpacity }}
        />

        {/* Dynamic Readability Scrim (drops to 0 when background is solo, active only when text is present) */}
        <motion.div
          className="hp-backdrop-scrim"
          aria-hidden="true"
          style={{ opacity: reduced ? 0.45 : scrimOpacity }}
        />
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
          style={{ pointerEvents: reduced ? 'auto' : heroPointer }}
        >
          <Container className="hero__content">
            <motion.div className="hero-text-anim-wrap">
              <motion.p
                className="hp-hero-eyebrow"
                {...(isMobile || reduced ? {} : eyebrowAnim)}
                style={
                  isMobile || reduced
                    ? undefined
                    : {
                        opacity: heroEyebrowOpacity,
                        y: heroEyebrowY,
                      }
                }
              >
                Welcome to our parish family
              </motion.p>
              <motion.h1
                className="hp-hero-display"
                style={
                  isMobile || reduced
                    ? undefined
                    : {
                        opacity: heroHeadingOpacity,
                        y: heroHeadingY,
                        scale: heroHeadingScale,
                      }
                }
              >
                <motion.span style={{ display: 'block' }} {...(isMobile || reduced ? {} : headingLine1Anim)}>
                  Faith, fellowship,
                </motion.span>
                <motion.span style={{ display: 'block' }} {...(isMobile || reduced ? {} : headingLine2Anim)}>
                  and a place to call home.
                </motion.span>
              </motion.h1>
              <motion.p
                className="hp-hero-lede"
                {...(isMobile || reduced ? {} : ledeAnim)}
                style={
                  isMobile || reduced
                    ? undefined
                    : {
                        opacity: heroLedeOpacity,
                        y: heroLedeY,
                      }
                }
              >
                {`Join ${churchName} for prayer, worship, and the shared life of our parish community.`}
              </motion.p>
              <motion.div
                className="actions"
                {...(isMobile || reduced ? {} : actionsAnim)}
                style={
                  isMobile || reduced
                    ? undefined
                    : {
                        opacity: heroActionsOpacity,
                        y: heroActionsY,
                        scale: heroActionsScale,
                      }
                }
              >
                <Link className="button button--light" to="/about">
                  Discover our parish <span aria-hidden="true">↗</span>
                </Link>
              </motion.div>
            </motion.div>
          </Container>

          <motion.button
            type="button"
            className="hero-scroll-indicator"
            onClick={() => {
              if (stageRef.current) {
                const stageHeight = stageRef.current.offsetHeight
                window.scrollTo({ top: stageHeight * 0.26, behavior: 'smooth' })
              } else {
                window.scrollTo({ top: window.innerHeight * 2, behavior: 'smooth' })
              }
            }}
            aria-label="Scroll down to explore parish content"
            {...promptAnim}
            style={
              reduced
                ? undefined
                : {
                    opacity: heroPromptOpacity,
                    scale: heroPromptScale,
                  }
            }
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
          style={{ pointerEvents: reduced ? 'auto' : ministriesChapter.pointer }}
        >
          <Container>
            <div className="hp-content-card">
              <motion.div
                className="hp-section-head"
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: ministriesChapter.head.opacity,
                        y: ministriesChapter.head.y,
                        scale: ministriesChapter.head.scale,
                      }
                }
              >
                <div>
                  <p className="eyebrow hp-eyebrow">Parish Life</p>
                  <h2 className="heading hp-heading">Many ways to grow together.</h2>
                </div>
                <Link className="button button--light" to="/ministries">
                  Explore ministries <span aria-hidden="true">→</span>
                </Link>
              </motion.div>

              <div className="hp-grid-3">
                {ministryPreviews.slice(0, 3).map((ministry, idx) => (
                  <motion.article
                    key={ministry.id}
                    className="hp-card"
                    style={
                      reduced
                        ? undefined
                        : {
                            opacity: ministriesChapter.items[idx]?.opacity,
                            y: ministriesChapter.items[idx]?.y,
                            scale: ministriesChapter.items[idx]?.scale,
                          }
                    }
                  >
                    <Link
                      to={`/ministries/${ministry.id}`}
                      className="hp-card-image-link"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <img className="hp-card-image" src={ministry.image.src} alt="" loading="lazy" />
                    </Link>
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
                  </motion.article>
                ))}
              </div>
            </div>
          </Container>
        </motion.div>

        {/* ---------------- CHAPTER 2: EVENTS ---------------- */}
        <motion.div
          className="hp-panel"
          style={{ pointerEvents: reduced ? 'auto' : eventsChapter.pointer }}
        >
          <Container>
            <div className="hp-content-card">
              <motion.div
                className="hp-section-head"
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: eventsChapter.head.opacity,
                        y: eventsChapter.head.y,
                        scale: eventsChapter.head.scale,
                      }
                }
              >
                <div>
                  <p className="eyebrow hp-eyebrow">What's Ahead</p>
                  <h2 className="heading hp-heading">Gatherings to look forward to.</h2>
                </div>
                <Link className="button button--light" to="/events">
                  View all events <span aria-hidden="true">→</span>
                </Link>
              </motion.div>

              <div className="hp-grid-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 3).map((event, idx) => (
                    <motion.article
                      key={event.id}
                      className="hp-card"
                      style={
                        reduced
                          ? undefined
                          : {
                              opacity: eventsChapter.items[idx]?.opacity,
                              y: eventsChapter.items[idx]?.y,
                              scale: eventsChapter.items[idx]?.scale,
                            }
                      }
                    >
                      <Link to="/events" className="hp-card-image-link" tabIndex={-1} aria-hidden="true">
                        <img
                          className="hp-card-image"
                          src={event.image_url || demoImages.gathering.src}
                          alt=""
                          loading="lazy"
                        />
                      </Link>
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
                    </motion.article>
                  ))
                ) : (
                  <motion.article
                    className="hp-card"
                    style={
                      reduced
                        ? { gridColumn: 'span 3' }
                        : {
                            gridColumn: 'span 3',
                            opacity: eventsChapter.items[0]?.opacity,
                            y: eventsChapter.items[0]?.y,
                            scale: eventsChapter.items[0]?.scale,
                          }
                    }
                  >
                    <span className="hp-card-badge">Upcoming</span>
                    <h3 className="hp-card-title">Parish Gatherings & Celebrations</h3>
                    <p className="hp-card-detail">
                      Check back soon for upcoming Holy Qurbana feasts, youth activities, and parish events.
                    </p>
                    <Link to="/events" className="hp-card-link">
                      Explore Events Calendar <span aria-hidden="true">→</span>
                    </Link>
                  </motion.article>
                )}
              </div>
            </div>
          </Container>
        </motion.div>

        {/* ---------------- CHAPTER 3: GALLERY ---------------- */}
        <motion.div
          className="hp-panel"
          style={{ pointerEvents: reduced ? 'auto' : galleryChapter.pointer }}
        >
          <Container>
            <div className="hp-content-card">
              <motion.div
                className="hp-section-head"
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: galleryChapter.head.opacity,
                        y: galleryChapter.head.y,
                        scale: galleryChapter.head.scale,
                      }
                }
              >
                <div>
                  <p className="eyebrow hp-eyebrow">Our Community</p>
                  <h2 className="heading hp-heading">The beauty of being together.</h2>
                </div>
                <Link className="button button--light" to="/gallery">
                  View gallery <span aria-hidden="true">→</span>
                </Link>
              </motion.div>

              <div className="hp-gallery-grid">
                {previewImages.length > 0 ? (
                  previewImages.slice(0, 3).map((img, idx) => (
                    <motion.div
                      key={img.id}
                      className="hp-gallery-card"
                      style={
                        reduced
                          ? undefined
                          : {
                              opacity: galleryChapter.items[idx]?.opacity,
                              y: galleryChapter.items[idx]?.y,
                              scale: galleryChapter.items[idx]?.scale,
                            }
                      }
                    >
                      <img src={img.image_url} alt={img.alt_text} loading="lazy" />
                    </motion.div>
                  ))
                ) : (
                  [demoImages.sanctuary, demoImages.prayer, demoImages.community].map((demo, idx) => (
                    <motion.div
                      key={demo.src}
                      className="hp-gallery-card"
                      style={
                        reduced
                          ? undefined
                          : {
                              opacity: galleryChapter.items[idx]?.opacity,
                              y: galleryChapter.items[idx]?.y,
                              scale: galleryChapter.items[idx]?.scale,
                            }
                      }
                    >
                      <img src={demo.src} alt={demo.alt} loading="lazy" />
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </Container>
        </motion.div>

        {/* ---------------- CHAPTER 4: CONTACT ---------------- */}
        <motion.div
          className="hp-panel"
          style={{
            pointerEvents: reduced ? 'auto' : contactPointer,
            visibility: reduced ? 'visible' : contactVisibility,
          }}
        >
          <Container>
            <motion.div
              className="hp-contact-box"
              style={
                reduced
                  ? undefined
                  : {
                      opacity: contactBoxOpacity,
                      y: contactBoxY,
                      scale: contactBoxScale,
                    }
              }
            >
              <motion.div
                style={
                  reduced
                    ? undefined
                    : {
                        opacity: contactHeadOpacity,
                        y: contactHeadY,
                        scale: contactHeadScale,
                      }
                }
              >
                <p className="eyebrow hp-eyebrow">Visit & Connect</p>
                <h2 className="heading hp-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)' }}>
                  There is a place for you here.
                </h2>
                <p className="hp-contact-desc">
                  Whether you are visiting for the first time, seeking prayer, or looking for a parish home, we warmly welcome you to join our family.
                </p>
                <motion.div
                  className="actions"
                  style={
                    reduced
                      ? { marginTop: '1.75rem' }
                      : {
                          marginTop: '1.75rem',
                          opacity: contactActionsOpacity,
                          y: contactActionsY,
                        }
                  }
                >
                  <Link className="button button--light" to="/contact">
                    Plan your visit <span aria-hidden="true">↗</span>
                  </Link>
                </motion.div>
              </motion.div>

              <div className="hp-contact-details">
                <motion.div
                  className="hp-contact-item"
                  style={
                    reduced
                      ? undefined
                      : {
                          opacity: contactItem0Opacity,
                          y: contactItem0Y,
                          scale: contactItem0Scale,
                        }
                  }
                >
                  <h4>Parish Sanctuary</h4>
                  <p>{churchAddress}</p>
                </motion.div>
                <motion.div
                  className="hp-contact-item"
                  style={
                    reduced
                      ? undefined
                      : {
                          opacity: contactItem1Opacity,
                          y: contactItem1Y,
                          scale: contactItem1Scale,
                        }
                  }
                >
                  <h4>Holy Qurbana & Worship</h4>
                  <p>
                    Sundays: Morning Prayer & Holy Qurbana<br />
                    Feast days & special liturgies as scheduled
                  </p>
                </motion.div>
                <motion.div
                  className="hp-contact-item"
                  style={
                    reduced
                      ? undefined
                      : {
                          opacity: contactItem2Opacity,
                          y: contactItem2Y,
                          scale: contactItem2Scale,
                        }
                  }
                >
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
                </motion.div>
              </div>
            </motion.div>
          </Container>
        </motion.div>
      </div>
    </div>
  )
}
