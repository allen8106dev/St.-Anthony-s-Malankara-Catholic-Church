import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../animation/Reveal'
import type { Album, Announcement, DemoImage, Event, Ministry, Sermon } from '../../data/siteContent'

export function PageHeader({ eyebrow, title, intro, image }: { eyebrow: string; title: string; intro: string; image?: DemoImage }) { return <section className={`page-header ${image ? 'page-header--image' : ''}`} style={image ? { backgroundImage: `linear-gradient(90deg, rgba(15,39,32,.91), rgba(15,39,32,.47)), url(${image.src})`, backgroundPosition: image.focal } : undefined}><div className="container"><Reveal><p className="eyebrow">{eyebrow}</p><h1 className="display">{title}</h1><p className="lede">{intro}</p></Reveal></div></section> }
export const formatDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
export function EventCard({ event }: { event: Event }) { return <article className="content-card event-card"><img src={event.image.src} alt={event.image.alt} loading="lazy" /><div><p className="eyebrow">{event.category} · {formatDate(event.date)}</p><h3>{event.title}</h3><p>{event.description}</p><dl className="meta"><div><dt>When</dt><dd>{event.time}</dd></div><div><dt>Where</dt><dd>{event.location}</dd></div></dl></div></article> }
export function MinistryCard({ ministry }: { ministry: Ministry }) { return <article className="content-card"><img src={ministry.image.src} alt={ministry.image.alt} loading="lazy" /><div><p className="eyebrow">Parish life</p><h3>{ministry.name}</h3><p>{ministry.description}</p><p className="quiet">{ministry.meeting}</p></div></article> }
export function SermonCard({ sermon }: { sermon: Sermon }) { return <article className="content-card"><img src={sermon.thumbnail.src} alt={sermon.thumbnail.alt} loading="lazy" /><div><p className="eyebrow">{sermon.series} · {formatDate(sermon.date)}</p><h3>{sermon.title}</h3><p>{sermon.description}</p><p className="quiet">{sermon.speaker} · {sermon.scripture}</p><a className="text-link" href={sermon.videoUrl} onClick={(event) => event.preventDefault()}>Watch when available <span aria-hidden="true">→</span></a></div></article> }
export function AnnouncementCard({ item }: { item: Announcement }) { return <article className="announcement"><p className="eyebrow">{item.category} · {formatDate(item.date)}</p><h3>{item.title}</h3><p>{item.summary}</p></article> }
export function EmptyPublicState({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><p className="eyebrow">Nothing here yet</p><h2 className="heading heading--small">{title}</h2><p>{detail}</p></div> }
export function GalleryLightbox({ albums }: { albums: Album[] }) {
  const images = albums.flatMap((album) => album.images)
  const [selected, setSelected] = useState<number | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (selected === null) return
    closeButton.current?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
      if (event.key === 'ArrowRight') setSelected((index) => index === null ? null : (index + 1) % images.length)
      if (event.key === 'ArrowLeft') setSelected((index) => index === null ? null : (index - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [selected, images.length])
  return <>
    <div className="gallery-grid">{images.map((item, index) => <button className="gallery-image" type="button" key={`${item.src}-${index}`} onClick={() => setSelected(index)}><img src={item.src} alt={item.alt} loading="lazy" /></button>)}</div>
    {selected !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onMouseDown={() => setSelected(null)}><button ref={closeButton} className="lightbox__close" type="button" onClick={() => setSelected(null)}>Close <span aria-hidden="true">×</span></button><img src={images[selected].src} alt={images[selected].alt} onMouseDown={(event) => event.stopPropagation()} /></div>}
  </>
}
export function Cta({ title = 'There is a place for you here.', to = '/contact', label = 'Plan your visit' }: { title?: string; to?: string; label?: string }) { return <section className="section cta"><div className="container"><p className="eyebrow">Stay connected</p><h2 className="heading">{title}</h2><p>Discover more about parish life or reach out when you are ready.</p><Link className="button button--light" to={to}>{label} <span aria-hidden="true">↗</span></Link></div></section> }
