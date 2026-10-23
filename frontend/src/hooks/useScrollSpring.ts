import { useSpring, type MotionValue, type SpringOptions } from 'motion/react'

export function scrollToTopQuickly() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: prefersReducedMotion ? 'instant' : 'smooth',
  })
  document.querySelector<HTMLElement>('.public-route')?.focus({ preventScroll: true })
}

export function useScrollSpring(source: MotionValue<number>, options: SpringOptions) {
  return useSpring(source, options)
}
