import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react'
import { demoImages, type DemoImage } from '../../data/siteContent'

interface PageLayoutProps {
  eyebrow: string
  title: string
  intro: string
  image?: DemoImage
  children: React.ReactNode
}

/**
 * Full-page layout shell for inner public pages.
 *
 * On desktop: renders the hero image as a sticky backdrop with 3D camera parallax zoom.
 * On mobile: renders a full-screen fixed hero background that does not move with scroll,
 * while hero text and widgets scroll up normally in document flow and smoothly fade out.
 */
export function PageLayout({ eyebrow, title, intro, image, children }: PageLayoutProps) {
  const heroTrackRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const activeImage = image ?? demoImages.sanctuary
  const location = useLocation()

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 760px)').matches : false
  )

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 760px)')
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // When navigating to a page with no hash, scroll past the hero to the main content.
  useEffect(() => {
    if (location.hash) return
    const el = heroTrackRef.current
    if (!el) return
    // On mobile the hero is just 100vh and the content starts right after,
    // so we only do this for desktop (heroTrack is 200vh).
    if (window.matchMedia('(max-width: 760px)').matches) return
    // Use requestAnimationFrame to ensure the DOM has settled after navigation.
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: el.offsetHeight, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(raf)
  }, [location.pathname, location.hash])


  // Window scroll tracking for natural mobile fade-out
  const { scrollY } = useScroll()
  const mobileHeroOpacity = useTransform(scrollY, [0, 240], [1, 0])

  // Track scroll on hero track for desktop parallax
  const { scrollYProgress } = useScroll({
    target: heroTrackRef,
    offset: ['start start', 'end start'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 75,
    damping: 24,
    restDelta: 0.0005,
  })

  const bgScale = useTransform(smoothProgress, [0, 0.85], [1.0, 1.12])
  const bgY = useTransform(smoothProgress, [0, 0.85], [0, -40])

  const promptOpacity = useTransform(smoothProgress, [0, 0.14], [1, 0])
  const promptScale = useTransform(smoothProgress, [0, 0.14], [1, 0.85])
  const eyebrowOpacity = useTransform(smoothProgress, [0.04, 0.42], [1, 0])
  const eyebrowY = useTransform(smoothProgress, [0.04, 0.42], [0, -30])
  const headingOpacity = useTransform(smoothProgress, [0.08, 0.58], [1, 0])
  const headingY = useTransform(smoothProgress, [0.08, 0.58], [0, -42])
  const headingScale = useTransform(smoothProgress, [0.08, 0.58], [1, 0.95])
  const ledeOpacity = useTransform(smoothProgress, [0.14, 0.72], [1, 0])
  const ledeY = useTransform(smoothProgress, [0.14, 0.72], [0, -32])
  const pointerEvents = useTransform(smoothProgress, v => (v < 0.65 ? 'auto' : 'none'))

  const easeOutExpo = [0.16, 1, 0.3, 1] as const

  const eyebrowAnim = (reduced || isMobile) ? {} : {
    initial: { opacity: 0, y: -16, letterSpacing: '0.08em' },
    animate: { opacity: 1, y: 0, letterSpacing: '0.14em' },
    transition: { duration: 0.85, delay: 0.15, ease: easeOutExpo },
  }
  const headingAnim = (reduced || isMobile) ? {} : {
    initial: { opacity: 0, y: 38, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.95, delay: 0.28, ease: easeOutExpo },
  }
  const ledeAnim = (reduced || isMobile) ? {} : {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay: 0.52, ease: easeOutExpo },
  }
  const promptAnim = (reduced || isMobile) ? {} : {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.75, delay: 0.95, ease: easeOutExpo },
  }

  const handleScrollDown = () => {
    if (heroTrackRef.current) {
      window.scrollTo({ top: heroTrackRef.current.offsetHeight, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
    }
  }

  return (
    <div className="pl-stage">
      {/* Persistent pinned backdrop - stays in view for the entire page */}
      <div className="pl-backdrop" aria-hidden="true">
        <motion.img
          src={activeImage.src}
          alt=""
          className="pl-backdrop-img"
          style={isMobile || reduced ? undefined : { scale: bgScale, y: bgY }}
        />
        <div className="pl-backdrop-scrim" />
      </div>

      {/* Hero track - full viewport hero on mobile, 200vh track on desktop */}
      <div ref={heroTrackRef} className="pl-hero-track">
        <div className="pl-hero-sticky">
          <motion.div
            className="container pl-hero-content"
            style={
              isMobile
                ? { opacity: mobileHeroOpacity }
                : { pointerEvents: reduced ? 'auto' : pointerEvents }
            }
          >
            <div className="hero-text-anim-wrap">
              <motion.p
                className="eyebrow page-hero__eyebrow"
                {...eyebrowAnim}
                style={isMobile ? undefined : (reduced ? undefined : { opacity: eyebrowOpacity, y: eyebrowY })}
              >
                {eyebrow}
              </motion.p>
              <motion.h1
                className="display page-hero__title"
                {...headingAnim}
                style={isMobile ? undefined : (reduced ? undefined : { opacity: headingOpacity, y: headingY, scale: headingScale })}
              >
                {title}
              </motion.h1>
              <motion.p
                className="lede page-hero__intro"
                {...ledeAnim}
                style={isMobile ? undefined : (reduced ? undefined : { opacity: ledeOpacity, y: ledeY })}
              >
                {intro}
              </motion.p>
            </div>
          </motion.div>

          <motion.button
            type="button"
            className="hero-scroll-indicator"
            onClick={handleScrollDown}
            aria-label="Scroll down to page content"
            {...promptAnim}
            style={isMobile || reduced ? undefined : { opacity: promptOpacity, scale: promptScale }}
          >
            <span className="hero-scroll-indicator__text">Scroll to explore</span>
            <span className="hero-scroll-indicator__mouse" aria-hidden="true">
              <span className="hero-scroll-indicator__wheel" />
            </span>
          </motion.button>
        </div>
      </div>

      {/* Page content - scrolls naturally over the persistent backdrop */}
      <div className="pl-content">
        {children}
      </div>
    </div>
  )
}
