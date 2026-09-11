import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/public/PublicElements'
import { demoImages } from '../../data/siteContent'

export function NotFoundPage() {
  return (
    <>
      <PageHeader
        eyebrow="404 — Page Not Found"
        title="This path leads somewhere else."
        intro="The page you are looking for is not available or has moved."
        image={demoImages.architecture}
      />
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <Link className="button button--primary" to="/">
            Return home <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  )
}

