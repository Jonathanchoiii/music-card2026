interface MusicPlayerProps {
  trackId: string
  compact?: boolean
  autoPlay?: boolean
}

export default function MusicPlayer({ trackId, compact, autoPlay }: MusicPlayerProps) {
  const height = compact ? 80 : 152
  const src = `https://open.spotify.com/embed/track/${trackId}?theme=0${autoPlay ? '&autoplay=1' : ''}`
  return (
    <div className="w-full max-w-sm mx-auto rounded-xl overflow-hidden">
      <iframe
        src={src}
        width="100%"
        height={height}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ border: 'none', borderRadius: '12px' }}
        title="Spotify Player"
      />
    </div>
  )
}
