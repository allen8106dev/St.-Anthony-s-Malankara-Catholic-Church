import type { HTMLAttributes, PropsWithChildren } from 'react'
export function Container({ children, className = '', ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) { return <div className={`container ${className}`} {...props}>{children}</div> }
