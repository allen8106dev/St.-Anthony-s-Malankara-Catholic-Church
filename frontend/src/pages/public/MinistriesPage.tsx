import { demoImages, ministries } from '../../data/siteContent'
import { Cta, MinistryCard, PageHeader } from '../../components/public/PublicElements'
import { Reveal } from '../../components/animation/Reveal'

export function MinistriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Parish life"
        title="Many ways to grow together."
        intro="These ministry entries are fictional placeholders, designed for the real ministries the parish will later share."
        image={demoImages.hands}
      />
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
    </>
  )
}

