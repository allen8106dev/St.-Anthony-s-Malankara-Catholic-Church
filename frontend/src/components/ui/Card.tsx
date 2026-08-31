import type { HTMLAttributes, PropsWithChildren } from 'react'

export function Card({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLElement>>) { return <section className="rounded-lg bg-white p-5 shadow-sm" {...props}>{children}</section> }
