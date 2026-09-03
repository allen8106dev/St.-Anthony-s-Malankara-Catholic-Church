import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { CustomCursor } from '../components/animation/CustomCursor'
import { PublicFooter } from '../components/layout/PublicFooter'
import { PublicNavbar } from '../components/navigation/PublicNavbar'

const pageMeta: Record<string, { title: string; description: string }> = {
  '/': { title: "St. Anthony's Malankara Catholic Church", description: 'A welcoming online home for prayer, community, and parish life.' },
  '/about': { title: 'About', description: 'Learn about the parish.' }, '/ministries': { title: 'Ministries', description: 'Explore parish ministries.' },
  '/events': { title: 'Events', description: 'Discover upcoming parish events.' }, '/announcements': { title: 'Announcements', description: 'Read parish announcements.' },
  '/sermons': { title: 'Messages', description: 'Browse reflections and messages.' }, '/gallery': { title: 'Gallery', description: 'Explore parish moments.' },
  '/contact': { title: 'Visit & contact', description: 'Plan a visit or contact the parish.' }, '/donate': { title: 'Give', description: 'Learn about future giving opportunities.' },
}

function getPageMeta(pathname: string): { title: string; description: string } {
  if (pageMeta[pathname]) return pageMeta[pathname]
  if (pathname.startsWith('/gallery/')) return { title: 'Photo Album', description: 'Explore parish moments.' }
  if (pathname.startsWith('/events/')) return { title: 'Event Details', description: 'Discover upcoming parish events.' }
  if (pathname.startsWith('/sermons/')) return { title: 'Message', description: 'Browse reflections and messages.' }
  return { title: 'Page not found', description: 'The requested page is unavailable.' }
}

export function PublicLayout() {
  const location = useLocation()

  useEffect(() => {
    const meta = getPageMeta(location.pathname)
    document.title = `${meta.title} | St. Anthony's Malankara Catholic Church`
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

  return <div className="site-shell"><PublicNavbar /><main key={location.pathname} className="public-route"><Outlet /></main><PublicFooter /><CustomCursor /></div>
}

