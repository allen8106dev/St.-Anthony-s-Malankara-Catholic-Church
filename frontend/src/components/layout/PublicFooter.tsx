import React from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { publicNavigation, siteName } from '../../data/siteContent'
import { usePublicSettings } from '../../hooks/usePublicContent'

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

const YouTubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
  </svg>
)

const SOCIAL_ICONS: Record<string, React.ComponentType> = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  YouTube: YouTubeIcon,
}

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
              <div className="footer__social-icons">
                {socialLinks.map((item) => {
                  const Icon = SOCIAL_ICONS[item.label]
                  return Icon ? (
                    <a
                      key={item.label}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer__social-icon-link"
                      aria-label={item.label}
                    >
                      <Icon />
                    </a>
                  ) : null
                })}
              </div>
            )}
          </div>
        </div>
        <div className="footer__bottom"><span>© {year} {churchName}</span><span>Serving the parish community.</span><Link className="footer__admin-link" to="/login">Admin Login</Link></div>
      </Container>
    </footer>
  )
}
