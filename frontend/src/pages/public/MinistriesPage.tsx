import { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { demoImages, ministries } from '../../data/siteContent'
import { Cta, MinistryCard } from '../../components/public/PublicElements'
import { PageLayout } from '../../components/public/PageLayout'
import { Reveal } from '../../components/animation/Reveal'

export function MinistriesPage() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace('#', ''))
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
  }, [location.hash])

  return (
    <PageLayout
      eyebrow="Parish life & ministries"
      title="Many ways to grow together."
      intro="Discover the vibrant youth movements, children's formation, lay associations, liturgical service, choir, and prayer fellowships that shape our parish life."
      image={ministries[0]?.image || demoImages.community}
    >
      {/* Quick Jump Navigation */}
      <section className="section--tight">
        <div className="container">
          <div className="ministry-jump-nav" aria-label="Quick jump to ministry">
            <span className="ministry-jump-nav__label">Ministries:</span>
            <div className="ministry-jump-nav__pills">
              {ministries.map((m) => (
                <Link key={m.id} to={`/ministries/${m.id}`} className="ministry-jump-pill">
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container card-grid">
          {ministries.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.08}>
              <MinistryCard ministry={item} />
            </Reveal>
          ))}
        </div>
      </section>
      <Cta title="Find a way to connect." to="/contact" label="Get in touch" />
    </PageLayout>
  )
}

