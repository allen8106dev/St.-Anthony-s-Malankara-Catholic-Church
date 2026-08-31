import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

export function Button({ children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) { return <button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" {...props}>{children}</button> }
