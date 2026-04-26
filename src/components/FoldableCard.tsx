import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColorPalette, SpotifyTrack } from '../types'

interface FoldableCardProps {
  palette: ColorPalette
  track: SpotifyTrack
  recipientName?: string
  coverTitle?: string
  senderName?: string
  children: ReactNode
  onOpened?: () => void
}

function rgb(c: [number, number, number]) {
  return `rgb(${c[0]},${c[1]},${c[2]})`
}
function rgba(c: [number, number, number], a: number) {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`
}

interface Confetti {
  id: number
  x: number
  y: number
  size: number
  color: string
  rotation: number
  vx: number
  vy: number
  rot: number
}

export default function FoldableCard({
  palette,
  track,
  recipientName,
  coverTitle,
  senderName,
  children,
  onOpened,
}: FoldableCardProps) {
  const [opened, setOpened] = useState(false)
  const [confetti, setConfetti] = useState<Confetti[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const title = coverTitle?.trim() || '送你一首歌'
  const to = recipientName?.trim()

  // Boost low-saturation palettes so the cover always feels rich, even when the
  // album art is greyscale (e.g. demo placeholder images).
  const boost = (c: [number, number, number]): [number, number, number] => {
    const max = Math.max(...c)
    const min = Math.min(...c)
    const sat = max === 0 ? 0 : (max - min) / max
    if (sat > 0.25) return c
    return [
      Math.min(255, c[0] + 90 - sat * 40),
      Math.min(255, c[1] + 30),
      Math.min(255, c[2] + 110 - sat * 30),
    ]
  }

  const coverGradient = useMemo(() => {
    const p = boost(palette.primary)
    const s = boost(palette.secondary)
    const a = boost(palette.accent)
    return `linear-gradient(135deg, ${rgb(p)} 0%, ${rgb(s)} 55%, ${rgb(a)} 100%)`
  }, [palette])

  const insidePeekColor = rgba(palette.background, 1)

  const handleOpen = () => {
    if (opened) return
    setOpened(true)
    spawnConfetti()
    if (audioRef.current && track.previewUrl) {
      audioRef.current.currentTime = 0
      audioRef.current.volume = 0
      void audioRef.current.play().then(() => {
        let v = 0
        const id = setInterval(() => {
          v = Math.min(0.85, v + 0.06)
          if (audioRef.current) audioRef.current.volume = v
          if (v >= 0.85) clearInterval(id)
        }, 80)
      }).catch(() => {})
    }
    setTimeout(() => onOpened?.(), 1200)
  }

  const spawnConfetti = () => {
    const colors = [
      rgb(palette.primary),
      rgb(palette.secondary),
      rgb(palette.accent),
      '#ffffff',
      rgb(palette.colors[0] ?? palette.primary),
    ]
    const items: Confetti[] = Array.from({ length: 60 }, (_, i) => ({
      id: Date.now() + i,
      x: 50,
      y: 50,
      size: 6 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vx: (Math.random() - 0.5) * 120,
      vy: -40 - Math.random() * 80,
      rot: (Math.random() - 0.5) * 720,
    }))
    setConfetti(items)
    setTimeout(() => setConfetti([]), 2400)
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#05050a]">
      {/* Hidden audio for autoplay (uses Spotify 30s preview) */}
      {track.previewUrl && (
        <audio ref={audioRef} src={track.previewUrl} loop preload="auto" />
      )}

      {/* Inside content (always rendered behind) */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: opened ? 1 : 0.94, opacity: opened ? 1 : 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: opened ? 0.5 : 0 }}
      >
        {children}
      </motion.div>

      {/* Cover (folds away on click) */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="cover-stage"
            className="absolute inset-0 flex items-center justify-center p-6"
            style={{ perspective: 2000 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.6 } }}
          >
            {/* Soft glow behind card */}
            <motion.div
              className="absolute"
              style={{
                width: 360,
                height: 540,
                background: `radial-gradient(circle, ${rgba(palette.primary, 0.45)}, transparent 70%)`,
                filter: 'blur(60px)',
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* The folding card */}
            <motion.button
              type="button"
              onClick={handleOpen}
              className="relative cursor-pointer outline-none"
              style={{
                width: 'min(86vw, 360px)',
                aspectRatio: '2 / 3',
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
              }}
              initial={{ rotateY: 0, scale: 0.6, y: 40, opacity: 0 }}
              animate={{
                rotateY: 0,
                scale: 1,
                y: 0,
                opacity: 1,
              }}
              exit={{
                rotateY: -165,
                scale: 1.05,
                transition: { duration: 1.1, ease: [0.7, 0, 0.3, 1] },
              }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ scale: 1.02, rotateZ: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Front face */}
              <div
                className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-white/10"
                style={{
                  background: coverGradient,
                  backfaceVisibility: 'hidden',
                }}
              >
                {/* Subtle noise + grain */}
                <div
                  className="absolute inset-0 mix-blend-overlay opacity-30"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.4), transparent 50%)',
                  }}
                />

                {/* Hairline border ornament */}
                <div className="absolute inset-3 rounded-2xl border border-white/15 pointer-events-none" />

                {/* Top label */}
                <div className="absolute top-8 left-0 right-0 flex flex-col items-center text-white/85">
                  <p className="text-[10px] tracking-[0.4em] uppercase opacity-70">
                    A Music Card
                  </p>
                  <p className="text-base mt-2 tracking-[0.3em] opacity-80">{title}</p>
                </div>

                {/* Center: floating album art with halo */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <motion.div
                    className="relative"
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {/* Halo */}
                    <div
                      className="absolute -inset-6 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${rgba(palette.accent, 0.6)}, transparent 70%)`,
                        filter: 'blur(18px)',
                      }}
                    />
                    {/* Album cover */}
                    <img
                      src={track.albumCoverUrl}
                      alt={track.albumName}
                      className="relative w-36 h-36 rounded-2xl object-cover shadow-2xl border border-white/20"
                      draggable={false}
                    />
                    {/* Vinyl peek behind */}
                    <div
                      className="absolute top-1/2 left-1/2 w-44 h-44 rounded-full border border-white/15 -z-10"
                      style={{
                        transform: 'translate(-50%, -50%)',
                        background: `radial-gradient(circle, ${rgba(palette.primary, 0.2)}, transparent 60%)`,
                      }}
                    />
                  </motion.div>

                  {/* Recipient (or song title fallback) */}
                  <motion.p
                    className="mt-8 text-white text-2xl font-semibold tracking-wide drop-shadow-lg text-center px-6"
                    style={{ fontFamily: 'serif' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    {to ? <>Dear&nbsp;{to}</> : track.name}
                  </motion.p>
                  {!to && (
                    <p className="text-white/70 text-sm mt-1 tracking-widest">
                      {track.artist}
                    </p>
                  )}
                </div>

                {/* Bottom: tap hint + sender */}
                <div className="absolute bottom-7 left-0 right-0 flex flex-col items-center gap-3">
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-white text-xs tracking-[0.3em] uppercase">
                      Tap to open
                    </span>
                  </motion.div>
                  {senderName && (
                    <p className="text-white/70 text-xs tracking-widest">
                      from&nbsp;·&nbsp;{senderName}
                    </p>
                  )}
                </div>

                {/* Decorative corner sparkles */}
                {[
                  { top: 16, left: 16 },
                  { top: 16, right: 16 },
                  { bottom: 16, left: 16 },
                  { bottom: 16, right: 16 },
                ].map((pos, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-white"
                    style={{ ...pos, boxShadow: '0 0 10px rgba(255,255,255,0.9)' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.4, 0.8] }}
                    transition={{ duration: 2.2, delay: i * 0.3, repeat: Infinity }}
                  />
                ))}
              </div>

              {/* Back face (visible mid-fold) */}
              <div
                className="absolute inset-0 rounded-3xl overflow-hidden border border-white/5"
                style={{
                  background: insidePeekColor,
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs tracking-[0.4em] uppercase">
                  · · ·
                </div>
              </div>
            </motion.button>

            {/* Outside-the-card hint */}
            <motion.p
              className="absolute bottom-8 text-white/40 text-xs tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              {track.previewUrl
                ? '打开后将自动播放音乐 · 请保持音量开启'
                : '打开后将开始体验 · 部分歌曲需手动播放'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti burst */}
      <AnimatePresence>
        {confetti.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
            {confetti.map((c) => (
              <motion.div
                key={c.id}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  width: c.size,
                  height: c.size * 0.4,
                  background: c.color,
                  borderRadius: 2,
                }}
                initial={{ x: 0, y: 0, rotate: c.rotation, opacity: 1 }}
                animate={{
                  x: c.vx * 4,
                  y: c.vy * 3 + 600,
                  rotate: c.rotation + c.rot,
                  opacity: 0,
                }}
                transition={{ duration: 2.2, ease: [0.2, 0.6, 0.4, 1] }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
