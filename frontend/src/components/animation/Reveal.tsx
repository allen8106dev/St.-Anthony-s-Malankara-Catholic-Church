import type { PropsWithChildren } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type RevealProps = PropsWithChildren<{ delay?: number; className?: string }>
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 38, scale: 0.96 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
