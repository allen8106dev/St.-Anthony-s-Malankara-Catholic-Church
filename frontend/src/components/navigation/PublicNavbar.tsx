import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Container } from '../ui/Container'
import { publicNavigation, siteName } from '../../data/siteContent'

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 24); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll) }, [])
  return <header className={`nav ${scrolled || open ? 'nav--scrolled' : ''}`}>
    <Container className="nav__inner">
      <Link className="brand" to="/" aria-label={`${siteName} home`}><span className="brand__mark" aria-hidden="true">✦</span><span>St. Anthony's<br />Malankara Catholic Church</span></Link>
      <button className="nav__toggle" type="button" aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '×' : '☰'}</span><span className="sr-only">{open ? 'Close' : 'Open'} navigation</span></button>
      <nav id="public-navigation" className={`nav__links ${open ? 'nav__links--open' : ''}`} aria-label="Public navigation">
        {publicNavigation.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}</NavLink>)}
        <NavLink className="button button--primary" to="/donate" onClick={() => setOpen(false)}>Donate <span aria-hidden="true">↗</span></NavLink>
      </nav>
    </Container>
  </header>
}
