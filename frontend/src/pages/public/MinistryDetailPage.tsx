import { Link, useParams } from 'react-router-dom'
import { ministries } from '../../data/siteContent'
import { Cta } from '../../components/public/PublicElements'
import { PageLayout } from '../../components/public/PageLayout'
import { Reveal } from '../../components/animation/Reveal'
import { Container } from '../../components/ui/Container'

export function MinistryDetailPage() {
  const { ministryId } = useParams<{ ministryId: string }>()
  const ministry = ministries.find((item) => item.id === ministryId)

  if (!ministry) {
    return (
      <PageLayout
        eyebrow="Ministries"
        title="Ministry not found"
        intro="The ministry you are looking for is not listed or has moved."
      >
        <section className="section">
          <Container>
            <div className="empty-state">
              <p className="eyebrow">Explore parish life</p>
              <h2 className="heading heading--small">Return to all ministries</h2>
              <p>Discover our youth movements, liturgical ministries, choir, and family fellowships.</p>
              <div style={{ marginTop: '1.5rem' }}>
                <Link to="/ministries" className="button button--primary">
                  View all ministries <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      eyebrow="Parish ministry"
      title={`${ministry.name} · ${ministry.fullName}`}
      intro={ministry.tagline}
      image={ministry.image}
    >

      <section className="section">
        <Container>
          {/* Breadcrumb */}
          <nav className="ministry-breadcrumb" aria-label="Breadcrumb">
            <Link to="/ministries" className="text-link">← All Ministries</Link>
            <span className="ministry-breadcrumb__sep" aria-hidden="true">/</span>
            <span className="ministry-breadcrumb__current">{ministry.name}</span>
          </nav>

          <div className="ministry-detail-layout">
            {/* Main Content */}
            <div className="ministry-detail-main">
              <Reveal>
                <div className="ministry-overview-card">
                  <span className="ministry-badge">{ministry.name}</span>
                  <h2 className="heading heading--small" style={{ marginTop: '0.8rem' }}>
                    About {ministry.name}
                  </h2>
                  <p className="ministry-lede">{ministry.description}</p>
                  <p className="ministry-body">{ministry.overview}</p>
                </div>
              </Reveal>

              {/* Key Activities */}
              <Reveal delay={0.1}>
                <div className="ministry-activities-section">
                  <p className="eyebrow">What we do</p>
                  <h3 className="ministry-subheading">Key Activities & Traditions</h3>
                  <ul className="ministry-activities-list">
                    {ministry.activities.map((activity, idx) => (
                      <li key={idx} className="ministry-activity-item">
                        <span className="ministry-activity-icon" aria-hidden="true">✦</span>
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              {/* Ministry Thematic Photo */}
              <Reveal delay={0.15}>
                <figure className="ministry-feature-photo">
                  <img src={ministry.image.src} alt={ministry.image.alt} loading="lazy" />
                  <figcaption>{ministry.image.alt}</figcaption>
                </figure>
              </Reveal>

            </div>

            {/* Sidebar */}
            <aside className="ministry-detail-sidebar">
              <Reveal delay={0.1}>
                <div className="ministry-info-card">
                  <h3 className="ministry-sidebar-title">Ministry Information</h3>
                  <dl className="ministry-info-list">
                    <div>
                      <dt>Gatherings & Meetings</dt>
                      <dd>{ministry.meeting}</dd>
                    </div>
                    <div>
                      <dt>Who Can Join</dt>
                      <dd>{ministry.whoCanJoin}</dd>
                    </div>
                    <div>
                      <dt>Leadership & Coordination</dt>
                      <dd>{ministry.leader}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>St. Anthony Parish Sanctuary & Community Center</dd>
                    </div>
                  </dl>
                </div>

                <div className="ministry-join-card">
                  <p className="eyebrow" style={{ color: 'var(--accent)' }}>Get involved</p>
                  <h4>Join {ministry.name}</h4>
                  <p>
                    All parishioners and seekers are warmly invited to take part in our ministries and grow in faith and fellowship.
                  </p>
                  <Link to="/contact" className="button button--primary" style={{ width: '100%' }}>
                    Contact Ministry Team <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </Reveal>
            </aside>
          </div>
        </Container>
      </section>

      <Cta
        title="Find a way to connect."
        to="/contact"
        label="Get in touch"
      />
    </PageLayout>
  )
}
