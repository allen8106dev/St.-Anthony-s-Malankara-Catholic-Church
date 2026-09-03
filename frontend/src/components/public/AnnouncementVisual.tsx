import type { PublicAnnouncement } from '../../hooks/usePublicContent'

export function AnnouncementVisual({ item, preview = false, imageScale = 100, imagePosition = 50 }: { item: PublicAnnouncement; preview?: boolean; imageScale?: number; imagePosition?: number }) {
  return (
    <article
      id={preview ? undefined : `announcement-${item.id}`}
      className={`announcement-visual${preview ? ' announcement-visual--preview' : ''}${item.image_url ? '' : ' announcement-visual--text-only'}`}
    >
      {item.image_url && <div className="announcement-visual__image"><img src={item.image_url} alt={`${item.title} announcement`} style={{ transform: `scale(${imageScale / 100})`, objectPosition: `${imagePosition}% center` }} /></div>}
      <div className="announcement-visual__body">
        <p className="eyebrow">Announcement</p>
        <h3>{item.title}</h3>
        {item.description && <p className="announcement-visual__description">{item.description}</p>}
      </div>
    </article>
  )
}
