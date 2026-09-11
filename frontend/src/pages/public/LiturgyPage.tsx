import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Cta, PageHeader } from '../../components/public/PublicElements'
import { Reveal } from '../../components/animation/Reveal'
import { demoImages } from '../../data/siteContent'
import { usePublicLiturgy } from '../../hooks/usePublicContent'

const liturgySections = [
  {
    id: 'holy-qurbono',
    eyebrow: 'The Holy Eucharist',
    title: 'Holy Qurbono',
    description: 'The Holy Qurbono is the heart of our worship: a sacred offering of thanksgiving where we gather as one body in Christ.',
    details: ['Come prepared for prayer and reverence.', 'Service timings are available on our About page.', 'All visitors are warmly welcome to worship with us.'],
  },
  {
    id: 'songs',
    eyebrow: 'Prayer in melody',
    title: 'Songs',
    description: 'Our liturgical hymns carry Scripture, faith, and devotion into the shared voice of the congregation.',
    details: ['Join the congregation in the familiar responses.', 'Listen for the chants that guide each moment of worship.', 'Resources and song selections will be shared here.'],
  },
  {
    id: 'novena',
    eyebrow: 'Intercession & devotion',
    title: 'Novena',
    description: 'Novena prayers invite us to persevere in faith, bringing our needs and thanksgiving before God through the saints.',
    details: ['Pray with the parish during devotional gatherings.', 'Bring your intentions for prayer.', 'Check announcements for upcoming novenas and feast preparations.'],
  },
  {
    id: 'holy-week',
    eyebrow: 'The Paschal mystery',
    title: 'Holy Week',
    description: 'During Holy Week, we walk with Christ through His passion, death, and glorious resurrection.',
    details: ['Palm Sunday opens the journey into the holy days.', 'Holy Thursday, Good Friday, and Easter are celebrated with special services.', 'Detailed schedules will be published before the season.'],
  },
]

export function LiturgyPage() {
  const location = useLocation()
  const { data: collections = [] } = usePublicLiturgy()

  useEffect(() => {
    const id = location.hash.slice(1)
    if (!id) return
    const timeout = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80)
    return () => window.clearTimeout(timeout)
  }, [location.hash])

  return <>
    <PageHeader
      eyebrow="Worship & tradition"
      title="Praying together in the Malankara tradition."
      intro="Discover the prayerful rhythm of our parish liturgy, from the Holy Qurbono to the sacred days of Holy Week."
      image={demoImages.sanctuary}
    />
    <section className="section liturgy-intro">
      <div className="container">
        <Reveal><p className="lede">Our liturgical life draws us into communion with God and one another. Explore these parts of our shared worship and return as resources are added.</p></Reveal>
      </div>
    </section>
    {collections.length > 0 ? (
      collections.map((collection, index) => (
        <section
          id={collection.id}
          className={`section liturgy-section${index % 2 ? ' section--muted' : ''}`}
          key={collection.id}
        >
          <div className="container liturgy-section__grid">
            <Reveal>
              <p className="eyebrow">Liturgy folder</p>
              <h2 className="heading">{collection.title}</h2>
              {collection.description && (
                <p className="liturgy-section__desc">{collection.description}</p>
              )}
            </Reveal>
            <Reveal delay={0.1}>
              {collection.resources.length > 0 ? (
                <div className="liturgy-public-resources">
                  <h3 className="liturgy-public-resources__heading">
                    Texts &amp; Resources ({collection.resources.length})
                  </h3>
                  <div className="liturgy-public-resources__list">
                    {collection.resources.map(resource => (
                      <a
                        key={resource.id}
                        href={resource.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="liturgy-public-doc-card"
                        title={`Open ${resource.title} PDF`}
                      >
                        <div className="liturgy-public-doc-card__icon" aria-hidden="true">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="M10 13v-2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2" />
                          </svg>
                          <span className="liturgy-pdf-tag">PDF</span>
                        </div>
                        <div className="liturgy-public-doc-card__body">
                          <span className="liturgy-public-doc-card__title">{resource.title}</span>
                          {resource.description && (
                            <span className="liturgy-public-doc-card__desc">
                              {resource.description}
                            </span>
                          )}
                        </div>
                        <span className="liturgy-public-doc-card__action" aria-hidden="true">
                          View PDF ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="liturgy-empty-folder-hint">
                  No PDF documents have been added to this section yet.
                </p>
              )}
            </Reveal>
          </div>
        </section>
      ))
    ) : (
      liturgySections.map((section, index) => (
        <section
          id={section.id}
          className={`section liturgy-section${index % 2 ? ' section--muted' : ''}`}
          key={section.id}
        >
          <div className="container liturgy-section__grid">
            <Reveal>
              <p className="eyebrow">{section.eyebrow}</p>
              <h2 className="heading">{section.title}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="lede">{section.description}</p>
              <ul className="liturgy-section__details">
                {section.details.map(detail => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      ))
    )}
    <Cta title="Join us in prayer." label="Plan your visit" to="/about#timings" />
  </>
}
