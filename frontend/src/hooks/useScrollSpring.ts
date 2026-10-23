import { useEffect } from 'react'
import { useSpring, type MotionValue, type SpringOptions } from 'motion/react'

const INSTANT_SCROLL_EVENT = 'church:scroll-to-top'

export function scrollToTopInstantly() {
  const root = document.documentElement
  root.classList.add('instant-scroll')
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  window.dispatchEvent(new Event(INSTANT_SCROLL_EVENT))
  document.querySelector<HTMLElement>('.public-route')?.focus({ preventScroll: true })

  requestAnimationFrame(() => {
    // Reset again after Motion has measured the new scroll position.
    window.dispatchEvent(new Event(INSTANT_SCROLL_EVENT))
    requestAnimationFrame(() => root.classList.remove('instant-scroll'))
  })
}

export function useScrollSpring(source: MotionValue<number>, options: SpringOptions) {
  const progress = useSpring(source, options)

  useEffect(() => {
    const reset = () => {
      source.jump(0)
      progress.jump(0)
    }
    window.addEventListener(INSTANT_SCROLL_EVENT, reset)
    return () => window.removeEventListener(INSTANT_SCROLL_EVENT, reset)
  }, [source, progress])

  return progress
}
