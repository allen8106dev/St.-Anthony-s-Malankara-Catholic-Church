import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'light' | 'outline' | 'ghost' }
export function Button({ children, variant = 'primary', className = '', ...props }: PropsWithChildren<ButtonProps>) { return <button className={`button button--${variant} ${className}`} {...props}>{children}</button> }
