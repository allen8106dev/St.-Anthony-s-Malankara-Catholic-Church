import { useEffect, useRef } from 'react'
import { ministries } from '../../data/siteContent'
import { MinistryCard } from './PublicElements'
import { Reveal } from '../animation/Reveal'

/**
 * Sticky horizontal-scroll section for the Ministries page.
 *
 * How it works:
 *  1. A tall outer wrapper ("scroll tunnel") creates vertical scroll room.
 *  2. An inner div is pinned with `position: sticky; top: 0; height: 100vh`.
 *  3. A JS scroll listener converts the vertical progress through the tunnel
 *     into a `translateX` on the card track — cards slide left as you scroll down.
 *  4. Once the last card is fully visible the sticky releases and the page
 *     continues scrolling normally downward.
 */
export function MinistryHScrollSection() {
  const tunnelRef = useRef<HTMLDivElement>(null)
  const trackRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tunnel = tunnelRef.current
    const track  = trackRef.current
    if (!tunnel || !track) return

    /** Total horizontal distance we need to slide (scrollWidth minus visible width). */
    const getOverflow = () => track.scrollWidth - track.clientWidth

    /** Synchronise tunnel height with the extra horizontal space needed. */
    const syncHeight = () => {
      // Make the tunnel tall enough that scrolling it covers all card overflow.
      // Add 100vh so the section is fully in view for a moment at start and end.
      tunnel.style.height = `calc(100vh + ${getOverflow()}px)`
    }

    syncHeight()

    const ro = new ResizeObserver(syncHeight)
    ro.observe(track)

    const onScroll = () => {
      if (!tunnel || !track) return
      const rect     = tunnel.getBoundingClientRect()
      const overflow = getOverflow()
      if (overflow <= 0) return

      // progress: 0 when sticky first pins, 1 when last card is fully in view
      const scrolled = -rect.top                               // px scrolled into tunnel
      const total    = tunnel.offsetHeight - window.innerHeight // total scroll room
      const progress = Math.max(0, Math.min(1, scrolled / total))

      track.style.transform = `translateX(${-progress * overflow}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // apply immediately in case already scrolled

    return () => {
      window.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [])

  return (
    /* Tall tunnel — provides vertical scroll room */
    <div ref={tunnelRef} className="ministry-hscroll-tunnel">
      {/* Sticky viewport-height slab */}
      <div className="ministry-hscroll-sticky">
        <div className="container">
          <div ref={trackRef} className="ministry-hscroll-track">
            {ministries.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.08}>
                <MinistryCard ministry={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

