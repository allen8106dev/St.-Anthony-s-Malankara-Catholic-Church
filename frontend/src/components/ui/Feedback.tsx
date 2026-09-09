import type { PropsWithChildren } from 'react'
import { BibleLoader, type BibleLoaderProps } from './BibleLoader'

export function Badge({ children }: PropsWithChildren) { return <span className="rounded bg-slate-100 px-2 py-1 text-sm">{children}</span> }
export function LoadingState({
  text = 'Loading…',
  size = 'md',
  inline = false,
  fullScreen = false,
  className = '',
}: BibleLoaderProps) {
  return <BibleLoader text={text} size={size} inline={inline} fullScreen={fullScreen} className={className} />
}
export function EmptyState({ children = 'Nothing to display yet.' }: PropsWithChildren) { return <p>{children}</p> }
export function ErrorState({ children = 'Something went wrong.' }: PropsWithChildren) { return <p role="alert">{children}</p> }
