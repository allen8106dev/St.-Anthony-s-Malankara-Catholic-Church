import { useState } from 'react'
import { demoImages } from '../../data/siteContent'
import { PageHeader } from '../../components/public/PublicElements'
import { usePublicSettings } from '../../hooks/usePublicContent'

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

export function ContactPage() {
  const { data: settings } = usePublicSettings()
  const [submitted, setSubmitted] = useState(false)

  const s = Object.fromEntries((settings ?? []).map((x) => [x.key, x.value]))
  const churchName = s.church_name || "St. Anthony's Malankara Catholic Church"
  const address = s.address || null
  const phone = s.phone || null
  const email = s.email || null
  const { safeUrl, embedUrl } = safeGoogleMapsConfig(s.google_maps_url || null)

  return (
    <>
      <PageHeader
        eyebrow="Visit &amp; Contact"
        title="Come as you are."
        intro="Whether joining us for Holy Qurbana, exploring the Malankara Catholic tradition, or reaching out to the parish office, you are warmly welcomed."
        image={demoImages.sanctuary}
      />

      <section className="section" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div className="container">
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

            <div className="contact-map-panel">
              {phone ? (
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="contact-action-row">
                  <span className="contact-action-row__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </span>
                  <span className="contact-action-row__text">
                    <strong>Number</strong>
                    <span>{phone}</span>
                  </span>
                </a>
              ) : (
                <div className="contact-action-row contact-action-row--disabled">
                  <span className="contact-action-row__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </span>
                  <span className="contact-action-row__text">
                    <strong>Number</strong>
                    <span>Phone number will be shared here.</span>
                  </span>
                </div>
              )}

              {email ? (
                <a href={`mailto:${email}`} className="contact-action-row">
                  <span className="contact-action-row__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <span className="contact-action-row__text">
                    <strong>Email</strong>
                    <span>{email}</span>
                  </span>
                </a>
              ) : (
                <div className="contact-action-row contact-action-row--disabled">
                  <span className="contact-action-row__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <span className="contact-action-row__text">
                    <strong>Email</strong>
                    <span>Parish email will be provided here.</span>
                  </span>
                </div>
              )}

              {safeUrl ? (
                <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="contact-action-row">
                  <span className="contact-action-row__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <span className="contact-action-row__text">
                    <strong>Go to map</strong>
                    <span>{address ?? 'Open the parish location in Google Maps'}</span>
                  </span>
                </a>
              ) : (
                <div className="contact-action-row contact-action-row--disabled">
                  <span className="contact-action-row__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <span className="contact-action-row__text">
                    <strong>Go to map</strong>
                    <span>{address ?? 'Map link will appear once the location is confirmed.'}</span>
                  </span>
                </div>
              )}

              <a href="#contact-note" className="contact-action-row">
                <span className="contact-action-row__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </span>
                <span className="contact-action-row__text">
                  <strong>Leave a message</strong>
                  <span>Send a note to the parish office</span>
                </span>
              </a>
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
    </>
  )
}

