import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { demoImages, ministries } from '../../data/siteContent'
import { Cta, EmptyPublicState, MinistryCard, PageHeader } from '../../components/public/PublicElements'
import { Reveal } from '../../components/animation/Reveal'
import { usePublicEvents, usePublicAnnouncements, usePublicSermons, usePublicGallery, usePublicSettings } from '../../hooks/usePublicContent'
import type { PublicAlbum } from '../../hooks/usePublicContent'

function safeGoogleMapsConfig(rawUrl: string | null) {
  if (!rawUrl) return { safeUrl: null as string | null, embedUrl: null as string | null }

  const trimmed = rawUrl.trim()
  if (!trimmed) return { safeUrl: null, embedUrl: null }

  try {
    const url = new URL(trimmed)
    const protocol = url.protocol.toLowerCase()
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')

    if (protocol !== 'http:' && protocol !== 'https:') return { safeUrl: null, embedUrl: null }

    const allowedHosts = new Set(['google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'])
    const isGoogleHost = hostname === 'google.com' || hostname.endsWith('.google.com') || allowedHosts.has(hostname)
    const hasMapsContent = url.pathname.includes('/maps') || url.searchParams.has('q') || url.searchParams.has('ll') || url.searchParams.has('query')

    if (!isGoogleHost || !hasMapsContent) return { safeUrl: null, embedUrl: null }

    const query =
      url.searchParams.get('q') ??
      url.searchParams.get('query') ??
      url.searchParams.get('ll') ??
      decodeURIComponent((url.pathname.replace(/^\/maps\/(?:place|search)\//, '') || '').replace(/\/+$/, ''))

    const embedUrl = query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : null
    return { safeUrl: url.toString(), embedUrl }
  } catch {
    return { safeUrl: null, embedUrl: null }
  }
}

function GalleryLightboxPublic({ albums }: { albums: PublicAlbum[] }) {
  const images = albums.flatMap(a => a.images)
  const [selected, setSelected] = useState<number | null>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (selected === null) return
    closeBtn.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
      if (e.key === 'ArrowRight') setSelected(i => i === null ? null : (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setSelected(i => i === null ? null : (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, images.length])
  if (images.length === 0) return null
  return <>
    <div className="gallery-grid">{images.map((img, i) => <button className="gallery-image" type="button" key={img.id} onClick={() => setSelected(i)}><img src={img.image_url} alt={img.alt_text} loading="lazy" /></button>)}</div>
    {selected !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onMouseDown={() => setSelected(null)}><button ref={closeBtn} className="lightbox__close" type="button" onClick={() => setSelected(null)}>Close <span aria-hidden="true">×</span></button><img src={images[selected].image_url} alt={images[selected].alt_text} onMouseDown={e => e.stopPropagation()} /></div>}
  </>
}

export function AboutPage() { return <><PageHeader eyebrow="About the parish" title="A home being prepared with care." intro="This page uses clearly marked demo content, ready to be replaced by the parish's confirmed story and history." image={demoImages.sanctuary} /><section className="section"><div className="container prose-grid"><Reveal><p className="eyebrow">Who we are</p><h2 className="heading">A parish story will live here.</h2></Reveal><Reveal delay={.1}><p className="lede">The future About page can hold the real history, spiritual heritage, leadership, and community life of St. Anthony's Malankara Catholic Church. Until that information is supplied, this is intentional placeholder copy—not a claim about the parish.</p><blockquote>“A space for real stories, shared faithfully when they are ready.”</blockquote></Reveal></div></section><section className="section--tight"><div className="container split-image"><img src={demoImages.gathering.src} alt={demoImages.gathering.alt} /><div><p className="eyebrow">Faith & community</p><h2 className="heading heading--small">Made for reflection, welcome, and belonging.</h2><p>Rich text, photographs, quotations, and a future parish timeline can be arranged here without changing the page structure.</p></div></div></section><Cta title="Come and discover parish life." /></> }
export function MinistriesPage() { return <><PageHeader eyebrow="Parish life" title="Many ways to grow together." intro="These ministry entries are fictional placeholders, designed for the real ministries the parish will later share." image={demoImages.hands} /><section className="section"><div className="container card-grid">{ministries.map((item, index) => <Reveal key={item.id} delay={index * .08}><MinistryCard ministry={item} /></Reveal>)}</div></section><Cta title="Find a way to connect." to="/contact" label="Get in touch" /></> }
export function EventsPage() {
  const { data: upcomingData, isLoading: loadingUp } = usePublicEvents({ timeframe: 'upcoming', limit: 20 })
  const { data: pastData, isLoading: loadingPast } = usePublicEvents({ timeframe: 'past', limit: 10 })
  const upcoming = upcomingData?.items ?? []
  const past = pastData?.items ?? []
  return <>
    <PageHeader eyebrow="Events" title="Gatherings to look forward to." intro="Upcoming and past parish events." image={demoImages.gathering} />
    <section className="section">
      <div className="container">
        <div className="section-head"><div><p className="eyebrow">Calendar</p><h2 className="heading">Upcoming events</h2></div></div>
        {loadingUp && <p role="status" style={{ color: 'var(--muted)' }}>Loading…</p>}
        {!loadingUp && upcoming.length === 0 && <EmptyPublicState title="No upcoming events" detail="Check back soon for parish gatherings." />}
        <div className="card-grid">
          {upcoming.map((ev, i) => (
            <Reveal key={ev.id} delay={i * .08}>
              <article className="content-card">
                {ev.image_url && <img src={ev.image_url} alt={ev.title} loading="lazy" />}
                <div>
                  <p className="eyebrow">{ev.category ? `${ev.category} · ` : ''}{new Date(ev.start_datetime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <h3>{ev.title}</h3>
                  <p>{ev.description ?? ''}</p>
                  <dl className="meta">
                    <div><dt>When</dt><dd>{new Date(ev.start_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</dd></div>
                    {ev.location && <div><dt>Where</dt><dd>{ev.location}</dd></div>}
                  </dl>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
    {(loadingPast || past.length > 0) && (
      <section className="section section--muted">
        <div className="container">
          <p className="eyebrow">Archive</p><h2 className="heading heading--small">Past events</h2>
          <div className="card-grid card-grid--single">
            {past.map(ev => (
              <article key={ev.id} className="content-card">
                <div>
                  <p className="eyebrow">{new Date(ev.start_datetime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <h3>{ev.title}</h3>
                  <p>{ev.description ?? ''}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    )}
  </>
}
export function AnnouncementsPage() {
  const { data, isLoading } = usePublicAnnouncements(50)
  const items = data?.items ?? []
  const general = items.filter(a => a.type !== 'FUNERAL' && a.type !== 'MARRIAGE')
  const funeralItems = items.filter(a => a.type === 'FUNERAL')
  const marriageItems = items.filter(a => a.type === 'MARRIAGE')
  const [featured, ...rest] = general
  return <>
    <PageHeader eyebrow="Parish news" title="Notices, shared with care." intro="Current parish announcements." />
    <section className="section">
      <div className="container">
        {isLoading && <p role="status" style={{ color: 'var(--muted)' }}>Loading…</p>}
        {!isLoading && items.length === 0 && <EmptyPublicState title="No announcements" detail="Parish notices will appear here when published." />}
        {featured && (
          <article className="featured-note">
            <p className="eyebrow">Featured · {featured.type}</p>
            <h2 className="heading">{featured.title}</h2>
            <p>{featured.description ?? ''}</p>
          </article>
        )}
        <div className="announcement-grid">
          {rest.map((item, i) => (
            <Reveal key={item.id} delay={i * .08}>
              <article className="announcement">
                <p className="eyebrow">{item.type}{item.published_at ? ` · ${new Date(item.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}</p>
                <h3>{item.title}</h3>
                <p>{item.description ?? ''}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
    {funeralItems.length > 0 && (
      <section className="section section--muted">
        <div className="container">
          <p className="eyebrow">Funeral &amp; Memorial Notices</p>
          <h2 className="heading heading--small">Remembering our departed.</h2>
          <div className="announcement-grid">
            {funeralItems.map((item, i) => (
              <Reveal key={item.id} delay={i * .08}>
                <article className="announcement">
                  <p className="eyebrow">{item.published_at ? new Date(item.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description ?? ''}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    )}
    {marriageItems.length > 0 && (
      <section className="section">
        <div className="container">
          <p className="eyebrow">Marriages &amp; Weddings</p>
          <h2 className="heading heading--small">Celebrating new beginnings.</h2>
          <div className="announcement-grid">
            {marriageItems.map((item, i) => (
              <Reveal key={item.id} delay={i * .08}>
                <article className="announcement">
                  <p className="eyebrow">{item.published_at ? new Date(item.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description ?? ''}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    )}
  </>
}
export function SermonsPage() {
  const { data, isLoading } = usePublicSermons(20)
  const items = data?.items ?? []
  const [featured, ...rest] = items
  return <>
    <PageHeader eyebrow="Messages" title="Reflections for the journey." intro="Homilies and reflections from the parish." image={demoImages.prayer} />
    {isLoading && <section className="section"><div className="container"><p role="status" style={{ color: 'var(--muted)' }}>Loading…</p></div></section>}
    {!isLoading && items.length === 0 && <section className="section"><div className="container"><EmptyPublicState title="No sermons yet" detail="Homilies and reflections will appear here when published." /></div></section>}
    {featured && (
      <section className="section">
        <div className="container">
          <article className="featured-sermon">
            {featured.thumbnail_url
              ? <img src={featured.thumbnail_url} alt={featured.title} />
              : <div style={{ background: 'var(--surface-muted)', minHeight: '25rem' }} />}
            <div>
              <p className="eyebrow">Featured message</p>
              <h2 className="heading">{featured.title}</h2>
              <p>{featured.description ?? ''}</p>
              {featured.video_url
                ? <a className="button button--primary" href={featured.video_url} target="_blank" rel="noopener noreferrer">Watch <span aria-hidden="true">↗</span></a>
                : <span className="quiet">Video coming soon</span>}
            </div>
          </article>
        </div>
      </section>
    )}
    {rest.length > 0 && (
      <section className="section section--muted">
        <div className="container">
          <p className="eyebrow">Archive</p><h2 className="heading heading--small">More reflections</h2>
          <div className="card-grid">
            {rest.map(s => (
              <article key={s.id} className="content-card">
                {s.thumbnail_url && <img src={s.thumbnail_url} alt={s.title} loading="lazy" />}
                <div>
                  <p className="eyebrow">{new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <h3>{s.title}</h3>
                  <p>{s.description ?? ''}</p>
                  <p className="quiet">{s.speaker_name}{s.scripture_reference ? ` · ${s.scripture_reference}` : ''}</p>
                  {s.video_url && <a className="text-link" href={s.video_url} target="_blank" rel="noopener noreferrer">Watch <span aria-hidden="true">→</span></a>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    )}
  </>
}
export function GalleryPage() {
  const { data, isLoading } = usePublicGallery(20)
  const items = data?.items ?? []
  return <>
    <PageHeader eyebrow="Gallery" title="Moments held close." intro="Parish photo albums." image={demoImages.architecture} />
    <section className="section">
      <div className="container">
        {isLoading && <p role="status" style={{ color: 'var(--muted)' }}>Loading…</p>}
        {!isLoading && items.length === 0 && <EmptyPublicState title="No albums yet" detail="Parish photo albums will appear here when published." />}
        <div className="album-list">
          {items.map(album => (
            <article key={album.id} className="album">
              {album.cover_image_url
                ? <img src={album.cover_image_url} alt={album.title} loading="lazy" />
                : <div style={{ position: 'absolute', inset: 0, background: 'var(--primary)' }} />}
              <div>
                <p className="eyebrow">Album</p>
                <h2>{album.title}</h2>
                <p>{album.description ?? ''}</p>
              </div>
            </article>
          ))}
        </div>
        {items.some(a => a.images.length > 0) && (
          <GalleryLightboxPublic albums={items} />
        )}
      </div>
    </section>
  </>
}
export function ContactPage() {
  const { data: settings } = usePublicSettings()
  const s = Object.fromEntries((settings ?? []).map(x => [x.key, x.value]))
  const address = s.address || null
  const phone = s.phone || null
  const email = s.email || null
  const officeHours = s.office_hours || null
  const { safeUrl, embedUrl } = safeGoogleMapsConfig(s.google_maps_url || null)

  return <>
    <PageHeader eyebrow="Visit &amp; contact" title="Come as you are." intro="Find us, reach out, or plan your visit." image={demoImages.sanctuary} />
    <section className="section">
      <div className="container contact-grid">
        <div>
          <p className="eyebrow">Visit us</p>
          <h2 className="heading heading--small">We’d love to see you.</h2>
          <dl className="contact-details">
            <div><dt>Address</dt><dd>{address ?? 'Address to be confirmed'}</dd></div>
            {phone && <div><dt>Phone</dt><dd><a href={`tel:${phone}`}>{phone}</a></dd></div>}
            {email && <div><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>}
            {officeHours && <div><dt>Office hours</dt><dd>{officeHours}</dd></div>}
          </dl>
          {safeUrl && (
            <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="button button--outline" style={{ marginTop: '1rem', display: 'inline-block' }}>
              View on Google Maps ↗
            </a>
          )}
        </div>

        <div className="map-panel" aria-live="polite">
          {embedUrl ? (
            <iframe
              title="Parish location map"
              src={embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="map-embed"
            />
          ) : safeUrl ? (
            <div className="map-placeholder map-placeholder--fallback" role="img" aria-label="Map location placeholder">
              <div>
                <strong>Map location</strong>
                <span>Google Maps preview is unavailable for this link.</span>
              </div>
            </div>
          ) : (
            <div className="map-placeholder" role="img" aria-label="Map location placeholder">
              <div>
                <strong>Map not configured</strong>
                <span>Location map has not been set yet.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
    <section className="section section--muted">
      <div className="container form-wrap">
        <div>
          <p className="eyebrow">Send a note</p>
          <h2 className="heading heading--small">We would love to hear from you.</h2>
          <p>This form does not send messages yet. Email delivery will be configured in a future phase.</p>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <label>Name<input required placeholder="Your name" /></label>
          <label>Email<input type="email" required placeholder="you@example.com" /></label>
          <label>Message<textarea required rows={4} placeholder="How can we help?" /></label>
          <button className="button button--primary" type="submit">Send message (not yet active)</button>
        </form>
      </div>
    </section>
  </>
}
export function DonatePage() { return <><PageHeader eyebrow="Give" title="Support what matters." intro="This is a visual demonstration only. No payments, personal financial details, or payment processing are collected in this phase." image={demoImages.hands} /><section className="section"><div className="container donate-grid"><div><p className="eyebrow">Why give</p><h2 className="heading heading--small">A future place for generosity.</h2><p className="lede">The parish will be able to explain real giving opportunities here once categories and payment details are confirmed.</p></div><form className="donate-form" onSubmit={(event) => event.preventDefault()}><p className="eyebrow">Demo interface — non-functional</p><fieldset><legend>Choose an amount</legend><div className="amounts">{['25', '50', '100', '250'].map((amount) => <button type="button" key={amount}>₹{amount}</button>)}</div></fieldset><label>Custom amount<input inputMode="decimal" placeholder="Enter amount" /></label><label>Purpose<select defaultValue="General Fund"><option>General Fund</option><option>Building</option><option>Missions</option><option>Other</option></select></label><button className="button button--primary" type="submit">Continue (demo)</button><p className="quiet">Secure payment details will be added only in a future payment phase.</p></form></div></section></> }
export function NotFoundPage() { return <section className="not-found"><div className="container"><p className="eyebrow">404</p><h1 className="display">This path leads somewhere else.</h1><p className="lede">The page you are looking for is not available.</p><Link className="button button--primary" to="/">Return home</Link></div></section> }
