import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useLayoutEffect } from 'react'
import { CustomCursor } from '../components/animation/CustomCursor'
import { PublicFooter } from '../components/layout/PublicFooter'
import { PublicNavbar } from '../components/navigation/PublicNavbar'
import { GlobalLoadingIndicator } from '../components/ui/GlobalLoadingIndicator'
import { ministries } from '../data/siteContent'

const pageMeta: Record<string, { title: string; description: string }> = {
  '/': { title: "St. Anthony's Malankara Catholic Church", description: 'A welcoming online home for prayer, community, and parish life.' },
  '/about': { title: 'About', description: 'Learn about the parish.' }, '/ministries': { title: 'Ministries', description: 'Explore parish ministries.' },
  '/events': { title: 'Events', description: 'Discover upcoming parish events.' }, '/announcements': { title: 'Announcements', description: 'Read parish announcements.' },
  '/gallery': { title: 'Gallery', description: 'Explore parish moments.' },
  '/liturgy': { title: 'Liturgy', description: 'Explore the prayers and traditions of our parish.' },
  '/contact': { title: 'Visit & contact', description: 'Plan a visit or contact the parish.' }, '/donate': { title: 'Give', description: 'Learn about future giving opportunities.' },
}

function getPageMeta(pathname: string): { title: string; description: string } {
  if (pageMeta[pathname]) return pageMeta[pathname]
  if (pathname.startsWith('/gallery/')) return { title: 'Photo Album', description: 'Explore parish moments.' }
  if (pathname.startsWith('/events/')) return { title: 'Event Details', description: 'Discover upcoming parish events.' }
  if (pathname.startsWith('/ministries/')) {
    const slug = pathname.replace('/ministries/', '').split('/')[0]
    const found = ministries.find(m => m.id === slug)
    if (found) return { title: `${found.name} (${found.fullName})`, description: found.description }
    return { title: 'Parish Ministry', description: 'Explore parish ministries.' }
  }
  return { title: 'Page not found', description: 'The requested page is unavailable.' }
}

export function PublicLayout() {
  const location = useLocation()

  useLayoutEffect(() => {
    if (!location.hash) {
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      const frame = requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior = ''
      })
      return () => cancelAnimationFrame(frame)
    }
  }, [location.pathname])

  useEffect(() => {
    const meta = getPageMeta(location.pathname)
    document.title = `${meta.title} | St. Anthony's Malankara Catholic Church`
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
  }, [location.pathname])

  return <div className="site-shell"><PublicNavbar /><main key={location.pathname} className="public-route"><Outlet /></main><PublicFooter /><CustomCursor /><GlobalLoadingIndicator /></div>
}
