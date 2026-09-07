import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useParams } from 'react-router-dom'
import { demoImages, ministries } from '../../data/siteContent'
import { Cta, EmptyPublicState, MinistryCard, PageHeader } from '../../components/public/PublicElements'
import { Reveal } from '../../components/animation/Reveal'
import { usePublicEvents, usePublicAnnouncements, usePublicGallery, usePublicAlbum, usePublicSettings, usePublicServiceTimes } from '../../hooks/usePublicContent'
import { AnnouncementVisual } from '../../components/public/AnnouncementVisual'
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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus({ preventScroll: true })

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
      if (e.key === 'ArrowRight') setSelected(i => i === null ? null : (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setSelected(i => i === null ? null : (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handler)
    }
  }, [selected, images.length])

  if (images.length === 0) return null
  return <>
    <div className="gallery-grid">{images.map((img, i) => <button className="gallery-image" type="button" key={img.id} onClick={() => setSelected(i)}><img src={img.image_url} alt={img.alt_text} loading="lazy" /></button>)}</div>
    {selected !== null && createPortal(
      <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onMouseDown={() => setSelected(null)}>
        <button ref={closeBtn} className="lightbox__close" type="button" onClick={() => setSelected(null)}>Close <span aria-hidden="true">×</span></button>
        <img src={images[selected].image_url} alt={images[selected].alt_text} onMouseDown={e => e.stopPropagation()} />
      </div>,
      document.body
    )}
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
  const location = useLocation()
  const items = data?.items ?? []

  useEffect(() => {
    if (location.hash && !isLoading && items.length > 0) {
      const el = document.querySelector(location.hash)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 120)
      }
    }
  }, [location.hash, isLoading, items.length])

  const renderGroup = (group: typeof items) => group.length > 0 && <div className="announcement-grid">{group.map((item, i) => <Reveal key={item.id} delay={i * .08}><AnnouncementVisual item={item} /></Reveal>)}</div>
  return <>
    <PageHeader eyebrow="Parish news" title="Notices, shared with care." intro="Current parish announcements." />
    <section className="section">
      <div className="container">
        {isLoading && <p role="status" style={{ color: 'var(--muted)' }}>Loading…</p>}
        {!isLoading && items.length === 0 && <EmptyPublicState title="No announcements" detail="Parish notices will appear here when published." />}
        {renderGroup(items)}
      </div>
    </section>
  </>
}
export function GalleryPage() {
  const { data, isLoading } = usePublicGallery(50)
  const items = data?.items ?? []
  return <>
    <PageHeader eyebrow="Gallery" title="Moments held close." intro="Parish photo albums." image={demoImages.architecture} />
    <section className="section">
      <div className="container">
        {isLoading && <p role="status" style={{ color: 'var(--muted)' }}>Loading…</p>}
        {!isLoading && items.length === 0 && <EmptyPublicState title="No albums yet" detail="Parish photo albums will appear here when published." />}
        <div className="album-list">
          {items.map(album => (
            <Link key={album.id} to={`/gallery/${album.id}`} className="album" style={{ display: 'block', textDecoration: 'none' }}>
              {album.cover_image_url
                ? <img src={album.cover_image_url} alt={album.title} loading="lazy" />
                : <div style={{ position: 'absolute', inset: 0, background: 'var(--primary)' }} />}
              <div>
                <p className="eyebrow">{album.images.length} photo{album.images.length !== 1 ? 's' : ''}</p>
                <h2>{album.title}</h2>
                {album.description && <p>{album.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  </>
}

export function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>()
  const { data: album, isLoading, isError } = usePublicAlbum(albumId)

  return <>
    <PageHeader
      eyebrow="Album"
      title={album?.title ?? 'Photo Album'}
      intro={album?.description ?? 'Moments and memories from parish life.'}
      image={album?.cover_image_url ? { src: album.cover_image_url, alt: album.title } : demoImages.architecture}
    />
    <section className="section">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/gallery" className="text-link" style={{ fontSize: '.95rem' }}>
            ← Back to Gallery
          </Link>
        </div>

        {isLoading && <p role="status" style={{ color: 'var(--muted)' }}>Loading album…</p>}
        {!isLoading && isError && (
          <EmptyPublicState title="Album not found" detail="The requested album could not be found or has not been published." />
        )}

        {album && (
          <>
            {album.images.length === 0 ? (
              <EmptyPublicState title="No photos yet" detail="Photos will appear here once added to this album." />
            ) : (
              <GalleryLightboxPublic albums={[album]} />
            )}
          </>
        )}
      </div>
    </section>
  </>
}
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ContactPage() {
  const { data: settings } = usePublicSettings()
  const { data: serviceTimes } = usePublicServiceTimes()
  const [submitted, setSubmitted] = useState(false)

  const s = Object.fromEntries((settings ?? []).map(x => [x.key, x.value]))
  const churchName = s.church_name || 'St. Anthony’s Malankara Catholic Church'
  const address = s.address || null
  const phone = s.phone || null
  const email = s.email || null
  const officeHours = s.office_hours || null
  const { safeUrl, embedUrl } = safeGoogleMapsConfig(s.google_maps_url || null)

  const activeServices = (serviceTimes ?? []).filter(st => st.is_active)

  return <>
    <PageHeader
      eyebrow="Visit &amp; Contact"
      title="Come as you are."
      intro="Whether joining us for Holy Qurbana, exploring the Malankara Catholic tradition, or reaching out to the parish office, you are warmly welcomed."
      image={demoImages.sanctuary}
    />

    {/* Contact Cards Grid */}
    <section className="section" style={{ paddingTop: '3.5rem', paddingBottom: '2.5rem' }}>
      <div className="container">
        <div className="contact-cards-grid">
          {/* Location Card */}
          <div className="contact-card">
            <div className="contact-card__icon-box" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h3 className="contact-card__title">Parish Location</h3>
            <p className="contact-card__content">{address ?? 'Parish address will be announced soon.'}</p>
            {safeUrl ? (
              <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="contact-card__action">
                Get Directions <span>↗</span>
              </a>
            ) : (
              <span className="contact-card__action" style={{ opacity: 0.6 }}>Address pending</span>
            )}
          </div>

          {/* Telephone Card */}
          <div className="contact-card">
            <div className="contact-card__icon-box" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <h3 className="contact-card__title">Telephone</h3>
            <p className="contact-card__content">{phone ?? 'Parish office telephone line will be shared here.'}</p>
            {phone ? (
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="contact-card__action">
                Call Parish Office <span>→</span>
              </a>
            ) : (
              <span className="contact-card__action" style={{ opacity: 0.6 }}>Phone pending</span>
            )}
          </div>

          {/* Email Card */}
          <div className="contact-card">
            <div className="contact-card__icon-box" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <h3 className="contact-card__title">Email Inquiries</h3>
            <p className="contact-card__content">{email ?? 'Direct parish email address will be provided here.'}</p>
            {email ? (
              <a href={`mailto:${email}`} className="contact-card__action">
                Send an Email <span>→</span>
              </a>
            ) : (
              <span className="contact-card__action" style={{ opacity: 0.6 }}>Email pending</span>
            )}
          </div>

          {/* Office Hours Card */}
          <div className="contact-card">
            <div className="contact-card__icon-box" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3 className="contact-card__title">Parish Office</h3>
            <p className="contact-card__content">{officeHours ?? 'Weekly consultations and pastoral appointments available upon request.'}</p>
            <a href="#contact-note" className="contact-card__action">
              Leave a Message <span>↓</span>
            </a>
          </div>
        </div>

        {/* Worship & Service Times Highlight Strip */}
        {activeServices.length > 0 && (
          <div className="contact-services-banner">
            <p className="eyebrow">Gather With Us</p>
            <h3>Holy Qurbana &amp; Service Schedule</h3>
            <div className="contact-services-grid">
              {activeServices.slice(0, 4).map(st => (
                <div key={st.id} className="contact-service-pill">
                  <div className="contact-service-pill__day">{DAYS_OF_WEEK[st.day_of_week]}</div>
                  <div className="contact-service-pill__time">{st.start_time.slice(0, 5)}</div>
                  <div className="contact-service-pill__name">{st.service_name}{st.location ? ` · ${st.location}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>

    {/* Map & Directions Showcase */}
    <section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '3.5rem' }}>
      <div className="container">
        <div className="section-head" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="eyebrow">Find Your Way</p>
            <h2 className="heading heading--small">Directions &amp; Location</h2>
          </div>
          {safeUrl && (
            <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-link">
              Open Full Map in Google Maps <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <div className="contact-map-layout">
          <div className="contact-map-frame" aria-live="polite">
            {embedUrl ? (
              <iframe
                title="Parish location map"
                src={embedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="contact-map-embed"
              />
            ) : safeUrl ? (
              <div className="map-placeholder" role="img" aria-label="Map location preview link">
                <div>
                  <strong>{churchName}</strong>
                  <span>{address ?? 'Location preview unavailable. Click below to open in Google Maps.'}</span>
                  <div style={{ marginTop: '1.25rem' }}>
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="button button--primary">
                      Open in Google Maps ↗
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="map-placeholder" role="img" aria-label="Map not configured">
                <div>
                  <strong>Location Map</strong>
                  <span>Interactive map will appear here once the parish location is confirmed.</span>
                </div>
              </div>
            )}
          </div>

          <div className="contact-map-directions">
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>Visiting Tips</p>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.35rem', margin: '0 0 0.6rem' }}>Planning Your Journey</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 1.25rem' }}>
                We are located conveniently to serve our Malankara Catholic faithful and friends across the region.
              </p>

              <div className="contact-direction-step">
                <div className="contact-direction-step__num">1</div>
                <div className="contact-direction-step__text">
                  <h4>Arrival &amp; Parking</h4>
                  <p>On-site church parking is readily available for Sunday worship, retreats, and special parish feast days.</p>
                </div>
              </div>

              <div className="contact-direction-step">
                <div className="contact-direction-step__num">2</div>
                <div className="contact-direction-step__text">
                  <h4>Step-Free Accessibility</h4>
                  <p>Wheelchair-accessible ramps and step-free entry doors ensure comfortable access for all elders and families.</p>
                </div>
              </div>

              <div className="contact-direction-step">
                <div className="contact-direction-step__num">3</div>
                <div className="contact-direction-step__text">
                  <h4>Welcoming Ushers</h4>
                  <p>Parish ushers are available at the entrance to guide you with hymn books, liturgy aids, and seating.</p>
                </div>
              </div>
            </div>

            {safeUrl && (
              <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="button button--primary" style={{ width: '100%' }}>
                  Get Driving Directions ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>

    {/* Message Inquiry Form Section */}
    <section id="contact-note" className="section section--muted">
      <div className="container contact-inquiry-layout">
        <div>
          <p className="eyebrow">Send a Note</p>
          <h2 className="heading heading--small">We would love to hear from you.</h2>
          <p className="lede" style={{ marginTop: '1rem' }}>
            Have a question regarding Holy Qurbana, sacrament preparations, parish registration, or pastoral support? Please send a message and our parish team will be glad to assist.
          </p>

          <div className="contact-form-notice" style={{ marginTop: '2rem' }}>
            <span className="contact-form-notice__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" x2="12" y1="8" y2="12"/>
                <line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
            </span>
            <span>Direct message dispatch is in demo mode. For urgent pastoral needs, please call the parish office directly.</span>
          </div>
        </div>

        <div className="contact-form-panel">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(23, 59, 50, 0.1)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.6rem', marginBottom: '0.6rem' }}>Message Received</h3>
              <p style={{ color: 'var(--muted)', lineHeight: '1.6', maxWidth: '26rem', margin: '0 auto 1.5rem' }}>
                Thank you for reaching out to {churchName}. Your note has been recorded for this demonstration.
              </p>
              <button type="button" className="button button--outline" onClick={() => setSubmitted(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}>
              <div className="contact-form-fields">
                <div className="contact-form-row">
                  <div className="contact-field-group">
                    <label className="contact-field-label" htmlFor="contact-name">Full Name *</label>
                    <input id="contact-name" required className="contact-field-input" placeholder="Your name" />
                  </div>
                  <div className="contact-field-group">
                    <label className="contact-field-label" htmlFor="contact-email">Email Address *</label>
                    <input id="contact-email" type="email" required className="contact-field-input" placeholder="you@example.com" />
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="contact-field-group">
                    <label className="contact-field-label" htmlFor="contact-phone">Phone Number</label>
                    <input id="contact-phone" type="tel" className="contact-field-input" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="contact-field-group">
                    <label className="contact-field-label" htmlFor="contact-subject">Topic / Purpose</label>
                    <input id="contact-subject" className="contact-field-input" placeholder="e.g. Visit Inquiry, Prayer Request" />
                  </div>
                </div>

                <div className="contact-field-group">
                  <label className="contact-field-label" htmlFor="contact-message">Message *</label>
                  <textarea id="contact-message" required rows={4} className="contact-field-textarea" placeholder="How can our parish family assist or pray for you?" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                  <button className="button button--primary" type="submit">
                    Send Message <span>↗</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>

    {/* Newcomers & Visitor Expectations */}
    <section className="section">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '38rem', margin: '0 auto 2.5rem' }}>
          <p className="eyebrow">Newcomers &amp; Guests</p>
          <h2 className="heading heading--small">What to expect when you visit</h2>
          <p className="lede" style={{ margin: '0.75rem auto 0' }}>
            We look forward to welcoming you into our community of prayer and fellowship.
          </p>
        </div>

        <div className="visitor-tips-grid">
          <div className="visitor-tip-card">
            <span className="visitor-tip-card__tag">Liturgy</span>
            <h3>West Syriac Rite</h3>
            <p>Our Holy Qurbana is celebrated in the historic West Syriac Malankara Catholic tradition, enriched with sacred chanting, incensing, and prayers in Malayalam and English.</p>
          </div>

          <div className="visitor-tip-card">
            <span className="visitor-tip-card__tag">Hospitality</span>
            <h3>Sunday Fellowship</h3>
            <p>Following the Holy Qurbana, all parishioners and visitors gather in the parish hall for tea, snacks, and warm conversation. We would love to meet you.</p>
          </div>

          <div className="visitor-tip-card">
            <span className="visitor-tip-card__tag">Community</span>
            <h3>Families &amp; Youth</h3>
            <p>Children and youth are an integral heartbeat of our parish, participating actively in Sunday school catechism (MCYM), altar service, and parish choirs.</p>
          </div>
        </div>
      </div>
    </section>
  </>
}
export function DonatePage() { return <><PageHeader eyebrow="Give" title="Support what matters." intro="This is a visual demonstration only. No payments, personal financial details, or payment processing are collected in this phase." image={demoImages.hands} /><section className="section"><div className="container donate-grid"><div><p className="eyebrow">Why give</p><h2 className="heading heading--small">A future place for generosity.</h2><p className="lede">The parish will be able to explain real giving opportunities here once categories and payment details are confirmed.</p></div><form className="donate-form" onSubmit={(event) => event.preventDefault()}><p className="eyebrow">Demo interface — non-functional</p><fieldset><legend>Choose an amount</legend><div className="amounts">{['25', '50', '100', '250'].map((amount) => <button type="button" key={amount}>₹{amount}</button>)}</div></fieldset><label>Custom amount<input inputMode="decimal" placeholder="Enter amount" /></label><label>Purpose<select defaultValue="General Fund"><option>General Fund</option><option>Building</option><option>Missions</option><option>Other</option></select></label><button className="button button--primary" type="submit">Continue (demo)</button><p className="quiet">Secure payment details will be added only in a future payment phase.</p></form></div></section></> }
export function NotFoundPage() { return <section className="not-found"><div className="container"><p className="eyebrow">404</p><h1 className="display">This path leads somewhere else.</h1><p className="lede">The page you are looking for is not available.</p><Link className="button button--primary" to="/">Return home</Link></div></section> }
