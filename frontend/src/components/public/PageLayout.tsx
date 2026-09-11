import { useRef } from 'react'
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
 * Renders the hero image as a permanently sticky backdrop (identical to the
 * homepage pattern). Hero text animates in on load and cascades out on scroll.
 * All children scroll over the pinned backdrop with semi-transparent
 * glassmorphism backgrounds so the image always shows through.
 */
export function PageLayout({ eyebrow, title, intro, image, children }: PageLayoutProps) {
  const heroTrackRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const activeImage = image ?? demoImages.sanctuary

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

  const eyebrowAnim = reduced ? {} : {
    initial: { opacity: 0, y: -16, letterSpacing: '0.08em' },
    animate: { opacity: 1, y: 0, letterSpacing: '0.14em' },
    transition: { duration: 0.85, delay: 0.15, ease: easeOutExpo },
  }
  const headingAnim = reduced ? {} : {
    initial: { opacity: 0, y: 38, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.95, delay: 0.28, ease: easeOutExpo },
  }
  const ledeAnim = reduced ? {} : {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay: 0.52, ease: easeOutExpo },
  }
  const promptAnim = reduced ? {} : {
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
      {/* Persistent pinned backdrop — stays in view for the entire page */}
      <div className="pl-backdrop" aria-hidden="true">
        <motion.img
          src={activeImage.src}
          alt=""
          className="pl-backdrop-img"
          style={reduced ? undefined : { scale: bgScale, y: bgY }}
        />
        <div className="pl-backdrop-scrim" />
      </div>

      {/* Hero track — gives scroll room for the hero text to dissolve out */}
      <div ref={heroTrackRef} className="pl-hero-track">
        <div className="pl-hero-sticky">
          <motion.div
            className="container pl-hero-content"
            style={{ pointerEvents: reduced ? 'auto' : pointerEvents }}
          >
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
          </motion.div>

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
        </div>
      </div>

      {/* Page content — scrolls over the persistent backdrop */}
      <div className="pl-content">
        {children}
      </div>
    </div>
  )
}
