import type { PropsWithChildren } from 'react'
export function Badge({ children }: PropsWithChildren) { return <span className="rounded bg-slate-100 px-2 py-1 text-sm">{children}</span> }
export function LoadingState() { return <p role="status">Loading…</p> }
export function EmptyState({ children = 'Nothing to display yet.' }: PropsWithChildren) { return <p>{children}</p> }
export function ErrorState({ children = 'Something went wrong.' }: PropsWithChildren) { return <p role="alert">{children}</p> }
