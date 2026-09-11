import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { demoImages } from '../../data/siteContent'
import { EmptyPublicState, PageHeader } from '../../components/public/PublicElements'
import { LoadingState } from '../../components/ui/Feedback'
import { usePublicAlbum, type PublicAlbum } from '../../hooks/usePublicContent'

function GalleryLightboxPublic({ albums }: { albums: PublicAlbum[] }) {
  const images = albums.flatMap((a) => a.images)
  const [selected, setSelected] = useState<number | null>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selected === null) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus({ preventScroll: true })

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
      if (e.key === 'ArrowRight') setSelected((i) => (i === null ? null : (i + 1) % images.length))
      if (e.key === 'ArrowLeft') setSelected((i) => (i === null ? null : (i - 1 + images.length) % images.length))
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handler)
    }
  }, [selected, images.length])

  if (images.length === 0) return null
  return (
    <>
      <div className="gallery-grid">
        {images.map((img, i) => (
          <button className="gallery-image" type="button" key={img.id} onClick={() => setSelected(i)}>
            <img src={img.image_url} alt={img.alt_text} loading="lazy" />
          </button>
        ))}
      </div>
      {selected !== null &&
        createPortal(
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            onMouseDown={() => setSelected(null)}
          >
            <button
              ref={closeBtn}
              className="lightbox__close"
              type="button"
              onClick={() => setSelected(null)}
            >
              Close <span aria-hidden="true">×</span>
            </button>
            <img
              src={images[selected].image_url}
              alt={images[selected].alt_text}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </>
  )
}

export function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>()
  const { data: album, isLoading, isError } = usePublicAlbum(albumId)

  return (
    <>
      <PageHeader
        eyebrow="Album"
        title={album?.title ?? 'Photo Album'}
        intro={album?.description ?? 'Moments and memories from parish life.'}
        image={album?.cover_image_url ? { src: album.cover_image_url, alt: album.title } : demoImages.architecture}
      />
      <section className="section">
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            <Link to="/gallery" className="text-link" style={{ fontSize: '.95rem' }}>
              ← Back to Gallery
            </Link>
          </div>

          {isLoading && <LoadingState text="Loading album…" />}
          {!isLoading && isError && (
            <EmptyPublicState
              title="Album not found"
              detail="The requested album could not be found or has not been published."
            />
          )}

          {album && (
            <>
              {album.images.length === 0 ? (
                <EmptyPublicState
                  title="No photos yet"
                  detail="Photos will appear here once added to this album."
                />
              ) : (
                <GalleryLightboxPublic albums={[album]} />
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
