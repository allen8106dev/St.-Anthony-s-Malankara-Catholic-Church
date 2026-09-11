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
    {(collections.length ? collections.map(collection => ({ id: collection.id, eyebrow: 'Liturgy resources', title: collection.title, description: '', details: collection.resources.map(resource => resource.title), resources: collection.resources })) : liturgySections).map((section, index) => (
      <section id={section.id} className={`section liturgy-section${index % 2 ? ' section--muted' : ''}`} key={section.id}>
        <div className="container liturgy-section__grid">
          <Reveal>
            <p className="eyebrow">{section.eyebrow}</p>
            <h2 className="heading">{section.title}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">{section.description}</p>
            <ul className="liturgy-section__details">
              {section.details.map((detail, detailIndex) => {
                const resource = 'resources' in section
                  ? (section.resources as { id: string; title: string; description: string | null; pdf_url: string }[])[detailIndex]
                  : undefined
                return <li key={resource?.id ?? detail}>{resource ? <a href={resource.pdf_url} target="_blank" rel="noreferrer">{resource.title}</a> : detail}</li>
              })}
            </ul>
          </Reveal>
        </div>
      </section>
    ))}
    <Cta title="Join us in prayer." label="Plan your visit" to="/about#timings" />
  </>
}
