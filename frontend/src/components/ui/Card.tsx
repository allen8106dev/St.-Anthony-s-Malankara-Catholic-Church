import type { HTMLAttributes, PropsWithChildren } from 'react'
export function Card({ children, className = '', ...props }: PropsWithChildren<HTMLAttributes<HTMLElement>>) { return <section className={`bg-[var(--surface)] p-5 ${className}`} {...props}>{children}</section> }
