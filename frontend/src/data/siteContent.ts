export const siteName = "St. Anthony's Malankara Catholic Church"
export const publicNavigation = [{ label: 'Home', to: '/' }, { label: 'About', to: '/about' }, { label: 'Ministries', to: '/ministries' }, { label: 'Events', to: '/events' }, { label: 'Gallery', to: '/gallery' }, { label: 'Liturgy', to: '/liturgy' }, { label: 'Announcements', to: '/announcements' }, { label: 'Contact', to: '/contact' }] as const

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

export type Ministry = {
  id: string
  name: string
  fullName: string
  tagline: string
  description: string
  overview: string
  whoCanJoin: string
  meeting: string
  leader: string
  activities: string[]
  image: DemoImage
}

export const ministries: Ministry[] = [
  {
    id: 'mcym',
    name: 'MCYM',
    fullName: 'Malankara Catholic Youth Movement',
    tagline: 'Hope, Purity, and Service in Christ',
    description: 'Empowering youth and young adults through spiritual formation, apostolic leadership, fellowship, and active service to the Church.',
    overview: 'The Malankara Catholic Youth Movement (MCYM) is the vibrant youth wing of the Syro-Malankara Catholic Church. It strives to bring together the youth of the parish to deepen their Catholic faith, cultivate leadership rooted in Gospel values, participate in the sacred liturgy, and serve the wider community. Through regular prayer meetings, youth conferences, charity drives, and cultural festivals, MCYM members build lifelong friendships founded in Christ.',
    whoCanJoin: 'Parish youth and young adults aged 15 to 35',
    meeting: 'Second & Fourth Sundays after Holy Qurbana',
    leader: 'Youth Animator & MCYM Parish Executive Committee',
    activities: [
      'Spiritual Retreats & Youth Conferences',
      'Parish Festival & Feast Day Coordination',
      'Community Charity & Outreach Drives',
      'Sports Meets, Cultural Events & Fellowships',
      'Liturgical Chanting & Active Service'
    ],
    image: image('photo-1529156069898-49953e39b3ac', 'MCYM youth gathered in joyful fellowship')
  },
  {
    id: 'mccl',
    name: 'MCCL',
    fullName: "Malankara Catholic Children's League",
    tagline: 'Friendship with Jesus, Service to All',
    description: 'Nurturing our children in faith, moral values, Bible study, and joyful parish fellowship from their earliest years.',
    overview: "The Malankara Catholic Children's League (MCCL) serves as the children's ministry and Sunday school association of our parish. Rooted in love for Jesus Christ and devotion to Mother Mary, MCCL guides children to discover the treasures of Holy Scripture, learn Catholic prayers and Malankara liturgical traditions, develop artistic talents, and cultivate a spirit of kindness and prayer.",
    whoCanJoin: 'Children in Sunday School from Kindergarten through 10th Grade',
    meeting: 'Every Sunday at 9:30 AM (before Holy Qurbana)',
    leader: 'Sunday School Headmaster & MCCL Animators',
    activities: [
      'Weekly Catechism & Sunday School',
      'Annual Bible Quiz & Talent Competitions',
      'Children’s Choir & Christmas Caroling',
      'Vacation Bible School (VBS)',
      'Saints Feast Day Presentations'
    ],
    image: image('photo-1485546246426-74dc88dec4d9', 'Children smiling and engaged in Sunday school')
  },
  {
    id: 'mca',
    name: 'MCA',
    fullName: 'Malankara Catholic Association',
    tagline: 'Faithful Lay Apostleship and Heritage Preservation',
    description: 'Uniting men and laity across the parish for leadership, spiritual renewal, family solidarity, and support of church life.',
    overview: 'The Malankara Catholic Association (MCA) is the official lay organization of the Syro-Malankara Catholic Church. It brings together men and family heads to actively support the pastoral mission of the parish, preserve our unique Antiochene liturgical heritage, defend Christian values in contemporary society, and assist the priest and parish council in community development and major parish celebrations.',
    whoCanJoin: 'All adult lay men and family heads of the parish',
    meeting: 'Third Sunday of every month following Holy Qurbana',
    leader: 'MCA President & Executive Council',
    activities: [
      'Parish Campus Stewardship & Maintenance',
      'Seminars on Catholic Social Teaching & Heritage',
      'Family Welfare & Bereavement Support',
      'Support for Diocesan & Ecumenical Initiatives',
      'Annual Feast Organizing Committees'
    ],
    image: image('photo-1511632765486-a01980e01a18', 'Parish association members in discussion')
  },
  {
    id: 'mcmf',
    name: 'MCMF',
    fullName: 'Malankara Catholic Movement Female',
    tagline: 'Walking in Faith, Humility, and Devotion like Mary',
    description: 'Fostering prayerful sisterhood, family sanctification, charitable works, and devotional life among parish mothers and women.',
    overview: 'The Malankara Catholic Movement Female (MCMF) / Mothers’ Forum gathers the women of the parish under the maternal patronage of the Blessed Virgin Mary. MCMF plays an indispensable role in church life—fostering prayer in the home, organizing Rosary devotions, preparing festive fellowship meals, visiting elderly and sick parishioners, and supporting the faith education of our youth.',
    whoCanJoin: 'All women and mothers of the parish community',
    meeting: 'First Sunday of each month following Holy Qurbana',
    leader: 'MCMF President & Executive Board',
    activities: [
      'First Friday Rosary & Fasting Prayers',
      'Hospitality for Parish Feasts & Celebrations',
      'Home Visits to the Sick and Elderly',
      'Parish Charity Sales & Welfare Fund',
      'Spiritual Retreats for Women & Mothers'
    ],
    image: image('photo-1573496359142-b8d87734a5a2', 'Women gathered in fellowship and prayer')
  },
  {
    id: 'choir',
    name: 'Choir Group',
    fullName: 'St. Anthony Parish Choir Group',
    tagline: 'Lifting Hearts in Sacred Hymns and Liturgical Praise',
    description: 'Leading the congregation in the ancient, meditative West Syriac liturgical chants and sacred choral music of the Malankara Rite.',
    overview: 'The Parish Choir leads the faithful in prayerful song during Sunday Holy Qurbana, holy days of obligation, weddings, feasts, and solemn liturgical seasons. Rooted in the rich musical traditions of the West Syriac Antiochene Rite, the choir combines traditional Syriac and Malayalam liturgical hymns with contemporary sacred music, helping elevate our minds to the mysteries of the Holy Sacrifice.',
    whoCanJoin: 'Parishioners with a love for singing, sacred music, or musical instruments',
    meeting: 'Saturday Evenings at 5:00 PM & Sunday at 8:00 AM',
    leader: 'Choir Director & Organist',
    activities: [
      'Holy Qurbana Liturgical Chanting',
      'Christmas Carol Service & Pageant',
      'Holy Week Passion & Resurrection Hymns',
      'Vocal Training & Syriac Melody Workshops',
      'Parish Feast Choral Celebrations'
    ],
    image: image('photo-1516280440614-37939bbacd81', 'Parish choir singing hymns in praise')
  },
  {
    id: 'altar',
    name: 'Altar',
    fullName: 'Altar Servers & Liturgical Ministry',
    tagline: 'Serving with Reverence before the Holy Sanctuary',
    description: 'Assisting the celebrant at the Holy Sanctuary (Madbaha) during Holy Qurbana and sacred ceremonies with holiness and dignity.',
    overview: 'The Altar Ministry consists of dedicated servers and acolytes who have the sacred privilege of assisting the priest during the Holy Qurbana, incense blessings (Dhoopam), processions, and sacramental rites. Serving at the altar instills deep reverence for the Holy Eucharist, fosters discipline, and has historically nurtured vocations to the priesthood and religious life.',
    whoCanJoin: 'Boys and youth who have received First Holy Communion',
    meeting: 'Liturgical Practice on the 1st and 3rd Saturdays at 4:00 PM',
    leader: 'Sacristan & Altar Server Coordinator',
    activities: [
      'Assisting at Sunday Holy Qurbana',
      'Thuyobo (Altar Preparation) & Censer Preparation',
      'Processional Cross & Candle Bearing',
      'Solemn Holy Week & Feast Day Liturgies',
      'Liturgical Etiquette & Altar Training Sessions'
    ],
    image: image('photo-1543807535-eceef0bc6599', 'Altar sanctuary candles and sacred reverence')
  },
  {
    id: 'prayer-groups',
    name: 'Prayer Groups',
    fullName: 'Family & Ward Prayer Groups',
    tagline: 'Where Two or Three Gather in His Name',
    description: 'Cottage and ward prayer fellowships meeting in parishioners’ homes for the Holy Rosary, Scripture reflection, and mutual support.',
    overview: 'The Family and Ward Prayer Groups form the grassroots spiritual backbone of our parish. Dividing the parish into geographic family units (wards), these groups meet on rotation in parishioners’ homes to pray the Holy Rosary, read and meditate on the Gospel, pray for the needs of the parish and universal Church, and share warm hospitality among neighboring families.',
    whoCanJoin: 'All parish families and parishioners within their local ward',
    meeting: 'Monthly in rotating family homes (Fridays or Saturday evenings)',
    leader: 'Ward Wardens & Family Prayer Coordinators',
    activities: [
      'Monthly Cottage Prayer Meetings',
      'Intercessory Rosary Chains',
      'Gospel Reflection & Faith Sharing',
      'Welcoming New Families to the Neighborhood',
      'Coordinating Ward Support for Parish Feasts'
    ],
    image: image('photo-1504052434569-70ad5836ab65', 'Candlelit prayer and contemplative devotion')
  }
]

export type Announcement = { id: string; title: string; summary: string; category: 'General' | 'Important' | 'Community' | 'Other'; date: string }
export const announcements: Announcement[] = [{ id: 'welcome', title: 'A note from the parish website team', summary: 'This featured message is fictional demo content and will be replaced with confirmed parish notices.', category: 'Important', date: '2026-08-24' }, { id: 'community', title: 'Community update', summary: 'A sample announcement designed to make room for future parish news.', category: 'Community', date: '2026-08-17' }, { id: 'general', title: 'Website information is forthcoming', summary: 'Real details will appear here as the parish confirms them.', category: 'General', date: '2026-08-10' }]

export type Album = { id: string; title: string; description: string; cover: DemoImage; images: DemoImage[] }
export const albums: Album[] = [{ id: 'moments', title: 'Parish moments', description: 'Demo album for future church photography.', cover: demoImages.gathering, images: [demoImages.gathering, demoImages.community, demoImages.hands] }, { id: 'quiet', title: 'Quiet spaces', description: 'A placeholder collection for imagery of prayer and worship.', cover: demoImages.prayer, images: [demoImages.prayer, demoImages.sanctuary, demoImages.architecture] }]
export const serviceTimes = [{ day: 'Sunday', time: '8:30 AM', name: 'Holy Qurbana' }, { day: 'Tuesday', time: '6:30 PM', name: 'Evening Prayer' }] as const
export const upcomingEvents = events.map(({ date, title, description }) => ({ date: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), title, detail: description }))
export const ministryPreviews = ministries.map((ministry, index) => ({
  id: ministry.id,
  number: String(index + 1).padStart(2, '0'),
  title: ministry.name,
  fullName: ministry.fullName,
  detail: ministry.description,
}))
