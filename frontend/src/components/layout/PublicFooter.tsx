import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { publicNavigation, siteName } from '../../data/siteContent'
import { usePublicSettings } from '../../hooks/usePublicContent'

export function PublicFooter() {
  const year = new Date().getFullYear()
  const { data: settings } = usePublicSettings()
  const s = Object.fromEntries((settings ?? []).map(item => [item.key, item.value]))
  const churchName = s.church_name || siteName
  const address = s.address || 'Address to be confirmed'
  const phone = s.phone || null
  const email = s.email || null
  const socialLinks = [
    { label: 'Facebook', url: s.facebook_url },
    { label: 'Instagram', url: s.instagram_url },
    { label: 'YouTube', url: s.youtube_url },
  ].filter(item => !!item.url)

  return (
    <footer className="footer">
      <Container>
        <div className="footer__grid">
          <div>
            <h2>{churchName}</h2>
            <p>Rooted in faith, gathered in hope, and welcoming all.</p>
          </div>
          <div>
            <h3>Explore</h3>
            <ul>{publicNavigation.slice(0, 4).map(item => <li key={item.to}><Link to={item.to}>{item.label}</Link></li>)}</ul>
          </div>
          <div>
            <h3>Visit</h3>
            <p>{address}</p>
          </div>
          <div>
            <h3>Connect</h3>
            <p>
              {email ? <><a href={`mailto:${email}`}>{email}</a><br /></> : 'Email to be confirmed'}
              {phone ? <><a href={`tel:${phone.replace(/\s+/g, '')}`}>{phone}</a></> : 'Phone to be confirmed'}
            </p>
            {socialLinks.length > 0 && (
              <p style={{ marginTop: '0.75rem' }}>
                {socialLinks.map((item, index) => (
                  <span key={item.label}>
                    {index > 0 && ' · '}
                    <a href={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
        <div className="footer__bottom"><span>© {year} {churchName}</span><span>Serving the parish community.</span></div>
      </Container>
    </footer>
  )
}
