import type { PropsWithChildren } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type RevealProps = PropsWithChildren<{ delay?: number; className?: string }>
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 18 }} whileInView={reduced ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
}
