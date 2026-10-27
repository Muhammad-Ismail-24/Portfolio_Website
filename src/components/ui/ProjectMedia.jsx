import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/* ════════════════════════════════════════════════════════════════════════════
   ProjectMedia — the preview area of a project card.

   Fills its (relative, fixed-aspect) parent. Slides are the optional demo video
   first, then each screenshot in project.images. With more than one slide it
   gets arrows, dots and swipe. Clicking a screenshot opens it full-size in a
   viewer (Esc closes, ← → move between screenshots). A video only loads once
   it's played, so cards stay light.

   project.video accepts a YouTube / Vimeo / Google Drive link (embedded) or a
   direct .mp4 / .webm URL (native player). Anything else is ignored here; use
   project.demo for plain links.
   ════════════════════════════════════════════════════════════════════════════ */

function parseVideo(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return { type: 'embed', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return { type: 'embed', src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` }
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
  if (drive) return { type: 'embed', src: `https://drive.google.com/file/d/${drive[1]}/preview` }
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) return { type: 'file', src: url }
  return null
}

const arrowBtn =
  'absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full border border-ink/40 bg-canvas/90 text-ink hover:bg-ink hover:text-canvas transition-colors'

const Chevron = ({ dir }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
)

export default function ProjectMedia({ project }) {
  const video = useMemo(() => parseVideo(project.video), [project.video])
  const [broken, setBroken] = useState(() => new Set())
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [zoom, setZoom] = useState(null) // index into images while the viewer is open
  const swipe = useRef(null)
  const dragged = useRef(false)

  const images = useMemo(
    () => (project.images ?? []).filter((img) => !broken.has(img.src)),
    [project.images, broken],
  )
  const slides = useMemo(() => {
    const shots = images.map((img) => ({ kind: 'image', ...img }))
    return video ? [{ kind: 'video', ...video }, ...shots] : shots
  }, [video, images])
  const n = slides.length

  if (n === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted bg-canvas px-3 py-1 border border-ink/30">
          Preview coming soon
        </span>
      </div>
    )
  }

  const i = Math.min(index, n - 1)
  const slide = slides[i]
  const poster = images[0]?.src

  const go = (step) => {
    setPlaying(false)
    setIndex((cur) => (Math.min(cur, n - 1) + step + n) % n)
  }
  const jump = (to) => {
    setPlaying(false)
    setIndex(to)
  }
  const openViewer = () => {
    if (dragged.current) return
    setZoom(Math.max(0, images.findIndex((img) => img.src === slide.src)))
  }
  const closeViewer = (at) => {
    if (at != null) setIndex(video ? at + 1 : at)
    setZoom(null)
  }

  const onPointerDown = (e) => {
    dragged.current = false
    swipe.current = e.target.closest('iframe, video') ? null : e.clientX
  }
  const onPointerUp = (e) => {
    if (swipe.current === null || n < 2) return
    const dx = e.clientX - swipe.current
    swipe.current = null
    if (Math.abs(dx) > 10) dragged.current = true
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
  }

  return (
    <div
      className="absolute inset-0 select-none"
      style={{ touchAction: 'pan-y' }}
      role={n > 1 ? 'group' : undefined}
      aria-roledescription={n > 1 ? 'carousel' : undefined}
      aria-label={n > 1 ? `${project.title} media` : undefined}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {slide.kind === 'image' && (
        <button
          type="button"
          onClick={openViewer}
          aria-label={`View ${slide.caption ?? 'screenshot'} larger`}
          className="absolute inset-0 cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-inset"
        >
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.caption ? `${project.title}: ${slide.caption}` : `${project.title} screenshot`}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setBroken((cur) => new Set(cur).add(slide.src))}
          />
        </button>
      )}

      {slide.kind === 'video' && !playing && (
        <>
          {poster && <img src={poster} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${project.title} demo video`}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-inset"
          >
            <span className="w-14 h-14 flex items-center justify-center rounded-full bg-canvas text-ink border-2 border-ink transition-transform group-hover:scale-110">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase bg-canvas text-ink px-2.5 py-1 border border-ink/40">Video demo</span>
          </button>
        </>
      )}

      {slide.kind === 'video' && playing && (
        video.type === 'file' ? (
          <video
            src={video.src}
            poster={poster}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        ) : (
          <iframe
            src={video.src}
            title={`${project.title} demo video`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0 bg-black"
          />
        )
      )}

      {slide.kind === 'image' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full border border-ink/40 bg-canvas/90 text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
        </span>
      )}

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous image" className={`${arrowBtn} left-2`}><Chevron dir="left" /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next image" className={`${arrowBtn} right-2`}><Chevron dir="right" /></button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center rounded-full bg-canvas/90 border border-ink/30 px-1" role="tablist" aria-label="Choose image">
            {slides.map((s, k) => (
              <button
                key={s.kind === 'video' ? 'video' : s.src}
                type="button"
                role="tab"
                aria-selected={k === i}
                aria-label={s.kind === 'video' ? 'Demo video' : `Image ${video ? k : k + 1} of ${images.length}`}
                onClick={() => jump(k)}
                className="p-[7px] outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-full"
              >
                <span
                  className={`block w-[7px] h-[7px] border border-ink transition-colors ${s.kind === 'video' ? 'rounded-[2px]' : 'rounded-full'} ${k === i ? 'bg-ink' : 'bg-transparent'}`}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {zoom !== null && <Viewer title={project.title} images={images} start={zoom} onClose={closeViewer} />}
    </div>
  )
}

/* Full-size screenshot viewer (portalled so card clipping and transforms can't trap it). */
function Viewer({ title, images, start, onClose }) {
  const [at, setAt] = useState(start)
  const closeRef = useRef(null)
  const count = images.length
  const img = images[at]

  const step = (d) => setAt((cur) => (cur + d + count) % count)

  useEffect(() => {
    const opener = document.activeElement
    closeRef.current?.focus()
    return () => opener?.focus?.({ preventScroll: true })
  }, [])

  // capture phase + stopImmediatePropagation: the project network also listens for
  // Esc / ← / → on window and must not react while the viewer is open
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(at)
      else if (e.key === 'ArrowRight' && count > 1) step(1)
      else if (e.key === 'ArrowLeft' && count > 1) step(-1)
      else return
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-3 p-4 sm:p-8 bg-black/85"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} screenshots`}
      data-lenis-prevent
      onClick={() => onClose(at)}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(at) }}
        aria-label="Close"
        className="absolute top-3 right-3 sm:top-5 sm:right-5 w-11 h-11 flex items-center justify-center rounded-full border border-white/40 bg-black/60 text-white hover:bg-white hover:text-black transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <img
        src={img.src}
        alt={img.caption ? `${title}: ${img.caption}` : `${title} screenshot`}
        className="max-w-full max-h-[78vh] sm:max-h-[84vh] object-contain border-2 border-white/20 bg-black"
        onClick={(e) => e.stopPropagation()}
      />

      <p className="font-mono text-xs tracking-[0.14em] uppercase text-white/80 text-center" onClick={(e) => e.stopPropagation()}>
        {img.caption && <span>{img.caption} · </span>}
        {at + 1} / {count}
      </p>

      {count > 1 && (
        <>
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={(e) => { e.stopPropagation(); step(d) }}
              aria-label={d < 0 ? 'Previous image' : 'Next image'}
              className={`absolute top-1/2 -translate-y-1/2 ${d < 0 ? 'left-2 sm:left-5' : 'right-2 sm:right-5'} w-11 h-11 flex items-center justify-center rounded-full border border-white/40 bg-black/60 text-white hover:bg-white hover:text-black transition-colors`}
            >
              <Chevron dir={d < 0 ? 'left' : 'right'} />
            </button>
          ))}
        </>
      )}
    </div>,
    document.body,
  )
}
