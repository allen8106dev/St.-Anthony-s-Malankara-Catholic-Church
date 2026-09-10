import { useEffect, useState } from 'react'

export interface HeroSlide {
  id: string
  image_url: string
  alt_text: string
}

const INTERVAL_MS = 6500

export function HeroSlideshow({
  slides,
  fallbackSrc,
  paused = false,
}: {
  slides: HeroSlide[]
  fallbackSrc: string
  paused?: boolean
}) {
  const images = slides.length > 0 ? slides : [{ id: 'fallback', image_url: fallbackSrc, alt_text: '' }]
  const [index, setIndex] = useState(0)
  const canRotate = images.length > 1
  const slideKey = images.map(img => img.id).join('|')

  useEffect(() => {
    setIndex(0)
  }, [slideKey])

  useEffect(() => {
    if (!canRotate || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setIndex(i => (i + 1) % images.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [canRotate, images.length, paused, index])

  return (
    <>
      <div className="hero__slides" aria-hidden="true">
        {images.map((slide, i) => (
          <div key={slide.id} className={`hero__slide${i === index ? ' is-active' : ''}`}>
            <img src={slide.image_url} alt="" className="hero__bg-img" />
          </div>
        ))}
      </div>
      {canRotate && (
        <div className="hero__pager" role="tablist" aria-label="Homepage photos">
          {images.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              className={`hero__dot${i === index ? ' is-active' : ''}`}
              aria-label={`Show photo ${i + 1}`}
              aria-selected={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </>
  )
}
