export const siteName = "St. Anthony's Malankara Catholic Church"
export const publicNavigation = [{ label: 'Home', to: '/' }, { label: 'About', to: '/about' }, { label: 'Ministries', to: '/ministries' }, { label: 'Events', to: '/events' }, { label: 'Sermons', to: '/sermons' }, { label: 'Gallery', to: '/gallery' }, { label: 'Contact', to: '/contact' }] as const

export type DemoImage = { src: string; alt: string; focal?: string; caption?: string }
const image = (id: string, alt: string, focal = 'center'): DemoImage => ({ src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=82`, alt, focal })
export const demoImages = { sanctuary: image('photo-1438032005730-c779502df39b', 'Sunlight falling inside a historic church'), gathering: image('photo-1511895426328-dc8714191300', 'People gathered together outdoors'), prayer: image('photo-1504052434569-70ad5836ab65', 'A candle lit during a quiet moment of prayer'), community: image('photo-1529156069898-49953e39b3ac', 'Friends sharing a conversation'), architecture: image('photo-1470770841072-f978cf4d019e', 'A peaceful landscape at golden hour'), hands: image('photo-1488521787991-ed7bbaae773c', 'Hands held together in a group') } as const

export type Event = { id: string; title: string; description: string; date: string; time: string; location: string; category: string; image: DemoImage }
export const events: Event[] = [
  { id: 'welcome-gathering', title: 'Community Welcome Gathering', description: 'A demo listing for a future parish gathering, with details to be confirmed.', date: '2026-09-20', time: 'Time to be confirmed', location: 'Location to be confirmed', category: 'Community', image: demoImages.gathering },
  { id: 'prayer-evening', title: 'Evening of Prayer', description: 'A placeholder for a reflective parish prayer gathering.', date: '2026-10-03', time: 'Time to be confirmed', location: 'Church sanctuary', category: 'Prayer', image: demoImages.prayer },
  { id: 'family-day', title: 'Parish Family Day', description: 'A fictional sample event for future community programming.', date: '2026-10-18', time: 'Schedule forthcoming', location: 'Parish campus', category: 'Fellowship', image: demoImages.community },
]
export const pastEvents: Event[] = [{ id: 'past-reflection', title: 'Seasonal Reflection', description: 'Demo archive content for a completed parish event.', date: '2026-07-12', time: 'Completed', location: 'Parish campus', category: 'Archive', image: demoImages.architecture }]

export type Ministry = { id: string; name: string; description: string; image: DemoImage; leader: string; meeting: string }
export const ministries: Ministry[] = [
  { id: 'one', name: 'Ministry One', description: 'A placeholder space for a future ministry description and invitation to participate.', image: demoImages.prayer, leader: 'Leader to be confirmed', meeting: 'Meeting information forthcoming' },
  { id: 'two', name: 'Ministry Two', description: 'Demo content showing how parish life and service opportunities can be presented.', image: demoImages.hands, leader: 'Leader to be confirmed', meeting: 'Meeting information forthcoming' },
  { id: 'three', name: 'Ministry Three', description: 'A future home for real ministry stories, contacts, and gathering details.', image: demoImages.community, leader: 'Leader to be confirmed', meeting: 'Meeting information forthcoming' },
]

export type Announcement = { id: string; title: string; summary: string; category: 'General' | 'Important' | 'Community' | 'Other'; date: string }
export const announcements: Announcement[] = [{ id: 'welcome', title: 'A note from the parish website team', summary: 'This featured message is fictional demo content and will be replaced with confirmed parish notices.', category: 'Important', date: '2026-08-24' }, { id: 'community', title: 'Community update', summary: 'A sample announcement designed to make room for future parish news.', category: 'Community', date: '2026-08-17' }, { id: 'general', title: 'Website information is forthcoming', summary: 'Real details will appear here as the parish confirms them.', category: 'General', date: '2026-08-10' }]

export type Sermon = { id: string; title: string; speaker: string; date: string; scripture: string; description: string; thumbnail: DemoImage; videoUrl: string; series: string }
export const sermons: Sermon[] = [{ id: 'hope', title: 'A reflection on hope', speaker: 'Guest speaker (demo)', date: '2026-08-16', scripture: 'Scripture reference forthcoming', description: 'Sample archive content for a future homily, reflection, or recorded message.', thumbnail: demoImages.sanctuary, videoUrl: '#', series: 'Reflections' }, { id: 'presence', title: 'Making room for grace', speaker: 'Guest speaker (demo)', date: '2026-08-09', scripture: 'Scripture reference forthcoming', description: 'A fictional example showing how future video messages can be organized.', thumbnail: demoImages.prayer, videoUrl: '#', series: 'Reflections' }, { id: 'together', title: 'The gift of gathering', speaker: 'Guest speaker (demo)', date: '2026-08-02', scripture: 'Scripture reference forthcoming', description: 'Demo content only; no actual clergy or parish message is represented.', thumbnail: demoImages.gathering, videoUrl: '#', series: 'Community' }]

export type Album = { id: string; title: string; description: string; cover: DemoImage; images: DemoImage[] }
export const albums: Album[] = [{ id: 'moments', title: 'Parish moments', description: 'Demo album for future church photography.', cover: demoImages.gathering, images: [demoImages.gathering, demoImages.community, demoImages.hands] }, { id: 'quiet', title: 'Quiet spaces', description: 'A placeholder collection for imagery of prayer and worship.', cover: demoImages.prayer, images: [demoImages.prayer, demoImages.sanctuary, demoImages.architecture] }]
export const serviceTimes = [{ day: 'Sunday', time: 'Time to be confirmed', name: 'Holy Qurbana', location: 'Church sanctuary' }, { day: 'Weekday', time: 'Time to be confirmed', name: 'Prayer gathering', location: 'Church sanctuary' }, { day: 'Seasonal', time: 'Schedule forthcoming', name: 'Special services', location: 'Parish campus' }] as const
export const upcomingEvents = events.map(({ date, title, description }) => ({ date: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), title, detail: description }))
export const ministryPreviews = ministries.map((ministry, index) => ({ number: String(index + 1).padStart(2, '0'), title: ministry.name, detail: ministry.description }))
