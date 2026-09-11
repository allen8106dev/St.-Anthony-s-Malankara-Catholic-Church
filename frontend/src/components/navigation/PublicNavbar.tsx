import { useEffect, useRef, useState } from 'react'
import type { Dispatch, MouseEvent as ReactMouseEvent, SetStateAction } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Container } from '../ui/Container'
import { ministries, publicNavigation, siteName } from '../../data/siteContent'
import { usePublicSettings, usePublicAnnouncements, usePublicLiturgy } from '../../hooks/usePublicContent'

function closeFocusedNav() {
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
}

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [lockedOpen, setLockedOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hoverTimeoutRef = useRef<number | null>(null)
  const [aboutHover, setAboutHover] = useState(false)
  const [liturgyHover, setLiturgyHover] = useState(false)
  const [ministriesHover, setMinistriesHover] = useState(false)
  const suppressAboutHover = useRef(false)
  const suppressMinistriesHover = useRef(false)
  const { data: settings } = usePublicSettings()
  const { data: announcementsData } = usePublicAnnouncements(1)
  const { data: liturgyCollections = [] } = usePublicLiturgy()
  const s = Object.fromEntries((settings ?? []).map(item => [item.key, item.value]))
  const churchName = s.church_name || siteName
  const hasAnnouncements = (announcementsData?.meta?.total ?? 0) > 0

  const open = lockedOpen || hovered

  function closeDropdownMenus() {
    suppressAboutHover.current = true
    suppressMinistriesHover.current = true
    setAboutHover(false)
    setLiturgyHover(false)
    setMinistriesHover(false)
    setLockedOpen(false)
    setHovered(false)
    closeFocusedNav()
  }

  const handleNavMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setHovered(true)
  }

  const handleNavMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHovered(false)
    }, 280)
  }

  const handleToggleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setHovered(true)
  }

  const handleToggleClick = () => {
    if (lockedOpen) {
      setLockedOpen(false)
      setHovered(false)
    } else {
      setLockedOpen(true)
      setHovered(true)
    }
  }

  function toggleMobileDropdown(event: ReactMouseEvent<HTMLAnchorElement>, setter: Dispatch<SetStateAction<boolean>>) {
    if (window.matchMedia('(max-width: 760px)').matches) {
      event.preventDefault()
      setter(value => !value)
    }
  }

  // Hovering mouse into top comfortable zone (Y <= 80px) uncollapses navbar & church name
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > 24) {
        if (e.clientY <= 80) {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
          }
          setHovered(true)
        } else if (e.clientY > 125 && !lockedOpen) {
          setHovered(false)
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [lockedOpen])

  useEffect(() => {
    const onScroll = () => {
      const isScrolled = window.scrollY > 24
      setScrolled(isScrolled)
      // Auto-close when user scrolls back to top (nav re-expands naturally)
      if (!isScrolled) {
        setLockedOpen(false)
        setHovered(false)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close nav when clicking outside it (while scrolled + open)
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setLockedOpen(false)
        setHovered(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <header
      ref={navRef}
      className={`nav ${scrolled ? 'nav--scrolled' : ''} ${open ? 'nav--open' : ''}`}
      onMouseEnter={handleNavMouseEnter}
      onMouseLeave={handleNavMouseLeave}
    >
      <Container className="nav__inner">
        <Link
          className="brand"
          to="/"
          aria-label={`${churchName} home`}
          onClick={() => {
            if (window.location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
        >
          <img
            src="/st-anthony-logo.jpg"
            alt={`${churchName} emblem`}
            className="brand__logo"
          />
          <span className="brand__name">{churchName}</span>
        </Link>
        <nav id="public-navigation" className={`nav__links ${open ? 'nav__links--open' : ''}`} aria-label="Public navigation">
        {publicNavigation.map((item) => {
          if (item.to === '/announcements') {
            return (
              <NavLink key={item.to} to={item.to} onClick={closeDropdownMenus} className="nav__announcements-link">
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
                <NavLink to={item.to} onClick={event => {
                  toggleMobileDropdown(event, setAboutHover)
                  if (!event.defaultPrevented) closeDropdownMenus()
                }} className="nav__link nav__link--has-dropdown">
                  {item.label}
                  <span className="nav__caret" aria-hidden="true" />
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
                <NavLink to={item.to} onClick={event => {
                  toggleMobileDropdown(event, setLiturgyHover)
                  if (!event.defaultPrevented) closeDropdownMenus()
                }} className="nav__link nav__link--has-dropdown">
                  {item.label}
                  <span className="nav__caret" aria-hidden="true" />
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

          if (item.to === '/ministries') {
            return (
              <div
                key={item.to}
                className={`nav__item nav__item--dropdown ${ministriesHover ? 'nav__item--dropdown-open' : ''}`}
                onMouseEnter={() => {
                  if (!suppressMinistriesHover.current) setMinistriesHover(true)
                }}
                onMouseLeave={() => {
                  suppressMinistriesHover.current = false
                  setMinistriesHover(false)
                }}
              >
                <NavLink to={item.to} onClick={event => {
                  toggleMobileDropdown(event, setMinistriesHover)
                  if (!event.defaultPrevented) closeDropdownMenus()
                }} className="nav__link nav__link--has-dropdown">
                  {item.label}
                  <span className="nav__caret" aria-hidden="true" />
                </NavLink>
                <div className="nav__dropdown-menu nav__dropdown-menu--ministries" role="menu" aria-label="Ministries">
                  <Link
                    to="/ministries"
                    onClick={closeDropdownMenus}
                    className="nav__dropdown-item nav__dropdown-item--all-ministries"
                    role="menuitem"
                  >
                    All ministries
                  </Link>
                  {ministries.map((ministry) => (
                    <Link
                      key={ministry.id}
                      to={`/ministries/${ministry.id}`}
                      onClick={closeDropdownMenus}
                      className="nav__dropdown-item nav__dropdown-item--ministry"
                      role="menuitem"
                    >
                      <span className="nav__dropdown-title">{ministry.name}</span>
                      <span className="nav__dropdown-desc">{ministry.fullName}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <NavLink key={item.to} to={item.to} onClick={closeDropdownMenus}>{item.label}</NavLink>
          )
        })}
      </nav>
      <button
        className={`nav__toggle ${open ? 'nav__toggle--open' : ''}`}
        type="button"
        aria-expanded={open}
        aria-controls="public-navigation"
        onClick={handleToggleClick}
        onMouseEnter={handleToggleMouseEnter}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
      >
        <span className="nav__hamburger" aria-hidden="true">
          <span className="nav__line nav__line--1" />
          <span className="nav__line nav__line--2" />
          <span className="nav__line nav__line--3" />
        </span>
        <span className="sr-only">{open ? 'Close' : 'Open'} navigation</span>
      </button>
    </Container>
  </header>
  )
}
