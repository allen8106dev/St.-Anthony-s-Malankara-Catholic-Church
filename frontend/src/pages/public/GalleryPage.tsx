import { Link } from 'react-router-dom'
import { demoImages } from '../../data/siteContent'
import { EmptyPublicState, PageHeader } from '../../components/public/PublicElements'
import { LoadingState } from '../../components/ui/Feedback'
import { Reveal } from '../../components/animation/Reveal'
import { usePublicGallery } from '../../hooks/usePublicContent'

export function GalleryPage() {
  const { data, isLoading } = usePublicGallery(50)
  const items = data?.items ?? []

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Moments held close."
        intro="Parish photo albums."
        image={demoImages.architecture}
      />
      <section className="section">
        <div className="container">
          {isLoading && <LoadingState text="Loading photo albums…" />}
          {!isLoading && items.length === 0 && (
            <EmptyPublicState
              title="No albums yet"
              detail="Parish photo albums will appear here when published."
            />
          )}
          <div className="album-list">
            {items.map((album, index) => (
              <Reveal key={album.id} delay={index * 0.08}>
                <Link
                  to={`/gallery/${album.id}`}
                  className="album"
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  {album.cover_image_url ? (
                    <img src={album.cover_image_url} alt={album.title} loading="lazy" />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, background: 'var(--primary)' }} />
                  )}
                  <div>
                    <p className="eyebrow">
                      {album.images.length} photo{album.images.length !== 1 ? 's' : ''}
                    </p>
                    <h2>{album.title}</h2>
                    {album.description && <p>{album.description}</p>}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export { AlbumDetailPage } from './AlbumDetailPage'

