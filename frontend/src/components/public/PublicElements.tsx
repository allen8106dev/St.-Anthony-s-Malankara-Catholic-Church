import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from 'motion/react'
import { demoImages, type Album, type Announcement, type DemoImage, type Event, type Ministry } from '../../data/siteContent'

export function PageHeader({ eyebrow, title, intro, image }: { eyebrow: string; title: string; intro: string; image?: DemoImage }) {
  const containerRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  // Fallback to sanctuary demo image if no image is passed
  const activeImage = image ?? demoImages.sanctuary

  // Scroll tracking identical to homepage
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 65,
    damping: 22,
    restDelta: 0.0005,
  })

  // Background 3D Camera / Parallax Zoom (exact same as homepage hero)
  const bgScale = useTransform(smoothProgress, [0, 1], [1.00, 1.10])
  const bgY = useTransform(smoothProgress, [0, 1], [0, -45])

  // Waterfall Cascade Dissolution on Scroll
  const promptOpacity = useTransform(smoothProgress, [0, 0.18], [1, 0])
  const promptScale = useTransform(smoothProgress, [0, 0.18], [1, 0.88])

  const eyebrowOpacity = useTransform(smoothProgress, [0.03, 0.45], [1, 0])
  const eyebrowY = useTransform(smoothProgress, [0.03, 0.45], [0, -28])

  const headingOpacity = useTransform(smoothProgress, [0.08, 0.60], [1, 0])
  const headingY = useTransform(smoothProgress, [0.08, 0.60], [0, -36])
  const headingScale = useTransform(smoothProgress, [0.08, 0.60], [1, 0.97])

  const ledeOpacity = useTransform(smoothProgress, [0.14, 0.72], [1, 0])
  const ledeY = useTransform(smoothProgress, [0.14, 0.72], [0, -30])

  // Initial Load Choreography
  const easeOutExpo = [0.16, 1, 0.3, 1] as const

  const eyebrowAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: -16, letterSpacing: '0.08em' },
        animate: { opacity: 1, y: 0, letterSpacing: '0.14em' },
        transition: { duration: 0.85, delay: 0.15, ease: easeOutExpo },
      }

  const headingAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 38, filter: 'blur(6px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        transition: { duration: 0.95, delay: 0.28, ease: easeOutExpo },
      }

  const ledeAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.85, delay: 0.52, ease: easeOutExpo },
      }

  const promptAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.75, delay: 0.95, ease: easeOutExpo },
      }

  const handleScrollDown = () => {
    containerRef.current?.nextElementSibling?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header ref={containerRef} className="page-hero page-header page-header--image">
      {/* Background Image Layer with Parallax & Scale */}
      <div className="page-hero__bg" aria-hidden="true">
        <motion.img
          src={activeImage.src}
          alt={activeImage.alt || title}
          className="page-hero__bg-img"
          style={reduced ? undefined : { scale: bgScale, y: bgY }}
        />
        {/* Cinematic Scrim Gradient (Ensures clean contrast for text and navbar) */}
        <div className="page-hero__scrim" />
      </div>

      {/* Foreground Content */}
      <div className="container page-hero__content">
        <div className="hero-text-anim-wrap">
          <motion.p
            className="eyebrow page-hero__eyebrow"
            {...eyebrowAnim}
            style={reduced ? undefined : { opacity: eyebrowOpacity, y: eyebrowY }}
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            className="display page-hero__title"
            {...headingAnim}
            style={reduced ? undefined : { opacity: headingOpacity, y: headingY, scale: headingScale }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="lede page-hero__intro"
            {...ledeAnim}
            style={reduced ? undefined : { opacity: ledeOpacity, y: ledeY }}
          >
            {intro}
          </motion.p>
        </div>
      </div>

      {/* Scroll Indicator Prompt */}
      <motion.button
        type="button"
        className="hero-scroll-indicator"
        onClick={handleScrollDown}
        aria-label="Scroll down to page content"
        {...promptAnim}
        style={reduced ? undefined : { opacity: promptOpacity, scale: promptScale }}
      >
        <span className="hero-scroll-indicator__text">Scroll to explore</span>
        <span className="hero-scroll-indicator__mouse" aria-hidden="true">
          <span className="hero-scroll-indicator__wheel" />
        </span>
      </motion.button>
    </header>
  )
}
export const formatDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
export function EventCard({ event }: { event: Event }) { return <article className="content-card event-card"><img src={event.image.src} alt={event.image.alt} loading="lazy" /><div><p className="eyebrow">{event.category} · {formatDate(event.date)}</p><h3>{event.title}</h3><p>{event.description}</p><dl className="meta"><div><dt>When</dt><dd>{event.time}</dd></div><div><dt>Where</dt><dd>{event.location}</dd></div></dl></div></article> }
export function MinistryCard({ ministry }: { ministry: Ministry }) {
  return (
    <article id={ministry.id} className="content-card ministry-card">
      <Link to={`/ministries/${ministry.id}`} className="ministry-card__image-link" tabIndex={-1} aria-hidden="true">
        <img src={ministry.image.src} alt={ministry.image.alt} loading="lazy" />
      </Link>
      <div>
        <p className="eyebrow">{ministry.fullName}</p>
        <h3>
          <Link to={`/ministries/${ministry.id}`} className="ministry-card__title-link">
            {ministry.name}
          </Link>
        </h3>
        <p>{ministry.description}</p>
        <p className="quiet" style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span aria-hidden="true" style={{ color: 'var(--accent)' }}>✦</span>
          <span>{ministry.meeting}</span>
        </p>
        <div style={{ marginTop: '1.2rem' }}>
          <Link to={`/ministries/${ministry.id}`} className="text-link">
            Learn more & details <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
export function AnnouncementCard({ item }: { item: Announcement }) { return <article className="announcement"><p className="eyebrow">{item.category} · {formatDate(item.date)}</p><h3>{item.title}</h3><p>{item.summary}</p></article> }
export function EmptyPublicState({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><p className="eyebrow">Nothing here yet</p><h2 className="heading heading--small">{title}</h2><p>{detail}</p></div> }
export function GalleryLightbox({ albums }: { albums: Album[] }) {
  const images = albums.flatMap((album) => album.images)
  const [selected, setSelected] = useState<number | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (selected === null) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus({ preventScroll: true })
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
      if (event.key === 'ArrowRight') setSelected((index) => index === null ? null : (index + 1) % images.length)
      if (event.key === 'ArrowLeft') setSelected((index) => index === null ? null : (index - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', key)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', key)
    }
  }, [selected, images.length])
  return <>
    <div className="gallery-grid">{images.map((item, index) => <button className="gallery-image" type="button" key={`${item.src}-${index}`} onClick={() => setSelected(index)}><img src={item.src} alt={item.alt} loading="lazy" /></button>)}</div>
    {selected !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onMouseDown={() => setSelected(null)}><button ref={closeButton} className="lightbox__close" type="button" onClick={() => setSelected(null)}>Close <span aria-hidden="true">×</span></button><img src={images[selected].src} alt={images[selected].alt} onMouseDown={(event) => event.stopPropagation()} /></div>}
  </>
}
export function Cta({ title = 'There is a place for you here.', to = '/contact', label = 'Plan your visit' }: { title?: string; to?: string; label?: string }) { return <section className="section cta"><div className="container"><p className="eyebrow">Stay connected</p><h2 className="heading">{title}</h2><p>Discover more about parish life or reach out when you are ready.</p><Link className="button button--light" to={to}>{label} <span aria-hidden="true">↗</span></Link></div></section> }
