import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { demoImages, ministries } from '../../data/siteContent'
import { Cta } from '../../components/public/PublicElements'
import { PageLayout } from '../../components/public/PageLayout'
import { MinistryHScrollSection } from '../../components/public/MinistryHScrollSection'

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
      <MinistryHScrollSection />
      <Cta title="Find a way to connect." to="/contact" label="Get in touch" />
    </PageLayout>
  )
}
