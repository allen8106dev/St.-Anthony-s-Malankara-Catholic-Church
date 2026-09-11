import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { demoImages } from '../../data/siteContent'
import { Cta } from '../../components/public/PublicElements'
import { PageLayout } from '../../components/public/PageLayout'
import { LoadingState } from '../../components/ui/Feedback'
import { Reveal } from '../../components/animation/Reveal'
import { usePublicContent, usePublicServiceTimes, usePublicSettings } from '../../hooks/usePublicContent'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatServiceClock(value: string) {
  const [hourStr, minuteStr] = value.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = ((hour + 11) % 12) + 1
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

export function AboutPage() {
  const location = useLocation()
  const { data: serviceTimesData, isLoading: loadingServices } = usePublicServiceTimes()
  const { data: aboutContent } = usePublicContent('about')
  const { data: settings } = usePublicSettings()
  const s = Object.fromEntries((settings ?? []).map(item => [item.key, item.value]))
  const churchName = s.church_name || "St. Anthony's Malankara Catholic Church"

  const pastorSection = aboutContent?.find(item => item.section === 'pastor')
  const historySection = aboutContent?.find(item => item.section === 'history')
  const introSection = aboutContent?.find(item => item.section === 'intro')

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 80)
      }
    }
  }, [location.hash])

  const activeServices = serviceTimesData ?? []

  return (
    <PageLayout
      eyebrow="About our parish"
      title={introSection?.heading || "Faith, fellowship, and sacred tradition."}
      intro={introSection?.body || "Discover our Holy Qurbana timings, meet our parish priest, and explore our historic Malankara Catholic heritage."}
      image={demoImages.sanctuary}
    >

      {/* 1. Timings Section */}
      <section id="timings" className="section about-section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <div>
                <p className="eyebrow">Worship &amp; Prayer</p>
                <h2 className="heading">Service Timings</h2>
              </div>
              <Link className="text-link" to="/contact">Directions &amp; visit details <span aria-hidden="true">→</span></Link>
            </div>
          </Reveal>

          <Reveal>
            <p className="lede">
              All are warmly welcome to join our parish in celebration of the Holy Qurbana, communal prayers, and liturgical feasts.
            </p>
          </Reveal>

          {loadingServices ? (
            <LoadingState text="Loading service timings…" />
          ) : (
            <div className="timings-grid">
              {(activeServices.length > 0 ? activeServices.slice().sort((a, b) => a.day_of_week - b.day_of_week) : [
                { id: 'fallback-sunday', day_of_week: 0, start_time: '08:30:00', end_time: null, service_name: 'Holy Qurbana' },
                { id: 'fallback-tuesday', day_of_week: 2, start_time: '18:30:00', end_time: null, service_name: 'Evening Prayer' },
              ]).map((st, i) => (
                <Reveal key={st.id} delay={i * 0.06}>
                  <article className={`timing-card ${st.day_of_week === 0 ? 'timing-card--featured' : ''}`}>
                    <div>
                      <span className="timing-card__day">
                        <span aria-hidden="true">✦</span> {DAYS_OF_WEEK[st.day_of_week] ?? 'Weekly'}
                      </span>
                      <h3 className="timing-card__title">{st.service_name}</h3>
                      <div className="timing-card__time">
                        <span aria-hidden="true">⏱</span> {formatServiceClock(st.start_time)}{st.end_time ? ` – ${formatServiceClock(st.end_time)}` : ''}
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal delay={0.2}>
            <div className="timings-note">
              <p>
                <strong>Sacramental Needs:</strong> For Holy Confession, house blessings, baptisms, or sick visits, please contact the Vicar directly.
              </p>
              <Link to="/contact" className="button button--primary" style={{ fontSize: '.84rem' }}>
                Contact parish office <span aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. Our Priest Section */}
      <section id="priest" className="section section--muted about-section">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Pastoral Leadership</p>
            <h2 className="heading">Our Priest</h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="priest-card" style={{ marginTop: '2.5rem' }}>
              <div className="priest-card__photo-wrap">
                <img
                  src={pastorSection?.image_url || demoImages.prayer.src}
                  alt={pastorSection?.heading || "Rev. Father Vicar"}
                  className="priest-card__photo"
                  loading="lazy"
                />
              </div>
              <div className="priest-card__info">
                <span className="priest-card__role">Vicar &amp; Spiritual Shepherd</span>
                <h3 className="priest-card__name">{pastorSection?.heading || "Rev. Father Vicar"}</h3>
                <blockquote className="priest-card__quote">
                  "May the peace of Christ fill our homes and hearts as we walk together in faith, prayer, and selfless love."
                </blockquote>
                <p className="priest-card__bio">
                  {pastorSection?.body ||
                    `Welcome to ${churchName}. As Vicar, it is my joy to shepherd this community in the sacred traditions of the Malankara Syrian Catholic Church. We are united in the Holy Eucharist and committed to caring for every family, empowering our youth, and extending compassionate service. You and your family will always find a warm home here.`}
                </p>
                <div className="actions">
                  <Link to="/contact" className="button button--primary">
                    Reach Out to Our Vicar <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. History Section */}
      <section id="history" className="section about-section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <div>
                <p className="eyebrow">Our Heritage</p>
                <h2 className="heading">Parish History</h2>
              </div>
            </div>
          </Reveal>

          <div className="history-grid">
            <Reveal>
              <div className="history-text">
                <p className="lede" style={{ marginBottom: '1.25rem' }}>
                  {historySection?.heading || "Rooted in apostolic antiquity, reunited in Catholic communion."}
                </p>
                {historySection?.body ? (
                  <p style={{ whiteSpace: 'pre-line' }}>{historySection.body}</p>
                ) : (
                  <>
                    <p>
                      <strong>The Malankara Catholic Church</strong> inherits the ancient faith of the Saint Thomas Christians (Nasranis) of India, tracing unbroken roots to the apostolic witness of St. Thomas in 52 AD along the Malabar coast.
                    </p>
                    <p>
                      Through centuries of trials, the church preserved its venerable <strong>West Syriac (Antiochene) liturgical rite</strong>, distinguished by deep biblical imagery, rich poetic hymns, and profound reverence for the Holy Mysteries.
                    </p>
                    <p>
                      On <strong>September 20, 1930</strong>, through the historic Reunion Movement guided by the <strong>Servant of God Archbishop Geevarghese Mar Ivanios</strong>, the church entered into full communion with the Holy See of Rome, creating an autonomous Eastern Catholic church sui iuris.
                    </p>
                    <p>
                      Founded under the celestial patronage of <strong>St. Anthony of Padua</strong>, our parish community was established to gather faithful families, sustain heritage in the diaspora, and nurture new generations in vibrant Christian life and charitable works.
                    </p>
                  </>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="history-milestones">
                <article className="history-milestone">
                  <div className="history-milestone__header">
                    <h4>Apostolic Dawn</h4>
                    <span className="history-milestone__badge">AD 52</span>
                  </div>
                  <p>St. Thomas the Apostle brings the Gospel to India, sowing seeds of the vibrant Nasrani Christian faith.</p>
                </article>

                <article className="history-milestone">
                  <div className="history-milestone__header">
                    <h4>West Syriac Rite</h4>
                    <span className="history-milestone__badge">Liturgical Rite</span>
                  </div>
                  <p>Adoption of the Antiochene liturgical tradition, celebrated with solemn chants, incense, and profound reverence.</p>
                </article>

                <article className="history-milestone">
                  <div className="history-milestone__header">
                    <h4>The Reunion</h4>
                    <span className="history-milestone__badge">1930</span>
                  </div>
                  <p>Historic reunion with the universal Catholic Church led by Servant of God Archbishop Geevarghese Mar Ivanios.</p>
                </article>

                <article className="history-milestone">
                  <div className="history-milestone__header">
                    <h4>St. Anthony's Parish</h4>
                    <span className="history-milestone__badge">Community</span>
                  </div>
                  <p>Our parish established under the patronage of St. Anthony, growing as a beacon of prayer, Sunday school, and fellowship.</p>
                </article>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Cta
        title="Come worship and grow in community."
        label="Plan a visit or get in touch"
        to="/contact"
      />
    </PageLayout>
  )
}
