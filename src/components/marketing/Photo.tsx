import type { Photo as PhotoT } from "./images"

// Plain <img> on purpose: remote Unsplash URLs, no Next image optimisation.
export default function Photo({ photo, sizes, className = "", priority = false, fade = false }: { photo: PhotoT; sizes: string; className?: string; priority?: boolean; fade?: boolean }) {
  return (
    <div className={`photo ${fade ? "photo-fade" : ""} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} srcSet={photo.srcSet} sizes={sizes} alt={photo.alt} loading={priority ? "eager" : "lazy"} decoding="async" />
    </div>
  )
}
