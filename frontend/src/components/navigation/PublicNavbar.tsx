import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Container } from '../ui/Container'
import { publicNavigation, siteName } from '../../data/siteContent'
import { usePublicSettings, usePublicAnnouncements, usePublicLiturgy } from '../../hooks/usePublicContent'

function closeFocusedNav() {
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
}

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [aboutHover, setAboutHover] = useState(false)
  const [liturgyHover, setLiturgyHover] = useState(false)
  const suppressAboutHover = useRef(false)
  const { data: settings } = usePublicSettings()
  const { data: announcementsData } = usePublicAnnouncements(1)
  const { data: liturgyCollections = [] } = usePublicLiturgy()
  const s = Object.fromEntries((settings ?? []).map(item => [item.key, item.value]))
  const churchName = s.church_name || siteName
  const hasAnnouncements = (announcementsData?.meta?.total ?? 0) > 0

  function closeDropdownMenus() {
    suppressAboutHover.current = true
    setAboutHover(false)
    setLiturgyHover(false)
    setOpen(false)
    closeFocusedNav()
  }

  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 24); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll) }, [])
  return <header className={`nav ${scrolled || open ? 'nav--scrolled' : ''}`}>
    <Container className="nav__inner">
      <Link className="brand" to="/" aria-label={`${churchName} home`}><span className="brand__mark" aria-hidden="true">✦</span><span>{churchName}</span></Link>
      <button className="nav__toggle" type="button" aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '×' : '☰'}</span><span className="sr-only">{open ? 'Close' : 'Open'} navigation</span></button>
      <nav id="public-navigation" className={`nav__links ${open ? 'nav__links--open' : ''}`} aria-label="Public navigation">
        {publicNavigation.map((item) => {
          if (item.to === '/announcements') {
            return (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className="nav__announcements-link">
                {item.label}
                {hasAnnouncements && <span className="nav__announcement-dot" aria-label="New announcements" />}
              </NavLink>
            )
          }

          if (item.to === '/about') {
            return (
              <div
                key={item.to}
                className={`nav__item nav__item--dropdown ${aboutHover ? 'nav__item--dropdown-open' : ''}`}
                onMouseEnter={() => {
                  if (!suppressAboutHover.current) setAboutHover(true)
                }}
                onMouseLeave={() => {
                  suppressAboutHover.current = false
                  setAboutHover(false)
                }}
              >
                <NavLink to={item.to} onClick={closeDropdownMenus} className="nav__link nav__link--has-dropdown">
                  {item.label}
                  <span className="nav__caret" aria-hidden="true">▾</span>
                </NavLink>
                <div className="nav__dropdown-menu" role="menu" aria-label="About sections">
                  <Link
                    to="/about#timings"
                    onClick={() => {
                      closeDropdownMenus()
                      document.getElementById('timings')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="nav__dropdown-item"
                    role="menuitem"
                  >
                    Timings
                  </Link>
                  <Link
                    to="/about#priest"
                    onClick={() => {
                      closeDropdownMenus()
                      document.getElementById('priest')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="nav__dropdown-item"
                    role="menuitem"
                  >
                    Our Priest
                  </Link>
                  <Link
                    to="/about#history"
                    onClick={() => {
                      closeDropdownMenus()
                      document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="nav__dropdown-item"
                    role="menuitem"
                  >
                    History
                  </Link>
                </div>
              </div>
            )
          }

          if (item.to === '/liturgy') {
            const sections = liturgyCollections.map(collection => [collection.id, collection.title] as const)
            return (
              <div
                key={item.to}
                className={`nav__item nav__item--dropdown ${liturgyHover ? 'nav__item--dropdown-open' : ''}`}
                onMouseEnter={() => {
                  if (!suppressAboutHover.current) setLiturgyHover(true)
                }}
                onMouseLeave={() => {
                  suppressAboutHover.current = false
                  setLiturgyHover(false)
                }}
              >
                <NavLink to={item.to} onClick={closeDropdownMenus} className="nav__link nav__link--has-dropdown">
                  {item.label}
                  <span className="nav__caret" aria-hidden="true">â–¾</span>
                </NavLink>
                <div className="nav__dropdown-menu" role="menu" aria-label="Liturgy sections">
                  {sections.map(([id, label]) => (
                    <Link
                      key={id}
                      to={`/liturgy#${id}`}
                      onClick={() => {
                        closeDropdownMenus()
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="nav__dropdown-item"
                      role="menuitem"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}</NavLink>
          )
        })}
        <NavLink className="button button--primary" to="/donate" onClick={() => setOpen(false)}>Donate <span aria-hidden="true">↗</span></NavLink>
      </nav>
    </Container>
  </header>
}
