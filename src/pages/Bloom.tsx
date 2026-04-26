import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BloomCanvas, { type BloomCanvasHandle } from '../components/BloomCanvas'
import { HaloPanel, HaloPanelToggle } from '../components/HaloPanel'
import { useAudioAnalyser } from '../hooks/useAudioAnalyser'
import { extractPalette } from '../services/colorExtract'
import type { ColorPalette } from '../types'
import { loadHaloParams, saveHaloParams, type HaloParams } from '../types/haloParams'

// ── Inline Apple Music client ────────────────────────────────────────────
// (Hits the existing /api/apple/* server routes. Self-contained so this page
// has no upstream dependencies on the apple-music feature module.)

interface AppleTrack {
  id: string
  name: string
  artist: string
  albumName: string
  albumCoverUrl: string
  previewUrl: string | null
  durationMs: number
  appleUrl: string
}

async function searchAppleTracks(query: string): Promise<AppleTrack[]> {
  const res = await fetch(`/api/apple/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return data.tracks as AppleTrack[]
}

async function getRandomAppleTracks(): Promise<AppleTrack[]> {
  const res = await fetch('/api/apple/random')
  if (!res.ok) throw new Error('Random failed')
  const data = await res.json()
  return data.tracks as AppleTrack[]
}

const FALLBACK_PALETTE: ColorPalette = {
  primary: [99, 140, 255],
  secondary: [220, 80, 200],
  accent: [255, 200, 120],
  background: [10, 8, 22],
  text: [240, 240, 240],
  colors: [
    [99, 140, 255],
    [220, 80, 200],
    [255, 200, 120],
    [10, 8, 22],
    [240, 240, 240],
  ],
}

export default function Bloom() {
  const navigate = useNavigate()

  const [track, setTrack] = useState<AppleTrack | null>(null)
  const [palette, setPalette] = useState<ColorPalette | null>(null)
  const [playing, setPlaying] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [haloParams, setHaloParams] = useState<HaloParams>(() => loadHaloParams())
  const [haloOpen, setHaloOpen] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const saveHaloTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canvasRef = useRef<BloomCanvasHandle | null>(null)
  const rafRef = useRef<number | null>(null)

  const { sample, resume } = useAudioAnalyser(audioRef.current)

  // ── Audio element lifecycle ─────────────────────────────────────────────
  useEffect(() => {
    const a = audioRef.current
    if (!a || !track?.previewUrl) return

    setAudioReady(false)
    setAudioError(null)
    setPlaying(false)
    setProgress(0)
    a.loop = true
    a.src = track.previewUrl
    a.load()

    const onLoaded = () => setAudioReady(true)
    const onTime = () => {
      if (a.duration > 0) setProgress(a.currentTime / a.duration)
    }
    const onErr = () => setAudioError('音频加载失败')

    a.addEventListener('loadeddata', onLoaded)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('error', onErr)
    return () => {
      a.removeEventListener('loadeddata', onLoaded)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('error', onErr)
    }
  }, [track?.previewUrl])

  // Sync play/pause to the actual <audio> element.
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      // resume() unlocks the AudioContext on first gesture.
      void resume()
      const p = a.play()
      if (p && typeof p.then === 'function') {
        p.catch(() => setPlaying(false))
      }
    } else {
      a.pause()
    }
  }, [playing, resume])

  // ── Per-frame analyser → canvas pump ────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const f = sample()
      canvasRef.current?.pushAudio(f)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [sample])

  useEffect(() => {
    if (saveHaloTimer.current) clearTimeout(saveHaloTimer.current)
    saveHaloTimer.current = setTimeout(() => {
      saveHaloParams(haloParams)
    }, 500)
    return () => {
      if (saveHaloTimer.current) clearTimeout(saveHaloTimer.current)
    }
  }, [haloParams])

  // ── Track selection ─────────────────────────────────────────────────────
  const handleSelectTrack = useCallback(async (t: AppleTrack) => {
    setTrack(t)
    setPalette(null)
    try {
      const pal = await extractPalette(t.albumCoverUrl)
      setPalette(pal)
    } catch {
      setPalette(FALLBACK_PALETTE)
    }
    // Auto-start after src has had a moment to load.
    window.setTimeout(() => setPlaying(true), 400)
  }, [])

  const togglePlay = useCallback(() => setPlaying((p) => !p), [])

  const handleBack = useCallback(() => {
    setPlaying(false)
    setTrack(null)
    setPalette(null)
    setProgress(0)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#06050d] text-white">
      {/* WebGPU canvas — runs even before a track is selected (idle drive). */}
      <BloomCanvas
        ref={canvasRef}
        palette={palette ?? FALLBACK_PALETTE}
        idle={!playing}
        haloParams={haloParams}
      />

      {/* Hidden audio element wired to the analyser. */}
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" playsInline />

      {/* Top-left: back to home */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
        aria-label="返回首页"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Top-center label */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none select-none">
        <p className="text-[10px] tracking-[0.4em] uppercase text-white/40">Aura Mesh</p>
        <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 mt-0.5">WebGPU · 专辑配色</p>
      </div>

      {/* Halo / contrast tuning (persisted) */}
      <div className="absolute top-14 right-3 z-30 max-w-[min(19rem,92vw)] pointer-events-auto">
        <HaloPanelToggle open={haloOpen} onOpenChange={setHaloOpen}>
          <HaloPanel value={haloParams} onChange={setHaloParams} />
        </HaloPanelToggle>
      </div>

      <AnimatePresence mode="wait">
        {!track ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md">
              <TrackPicker onPick={handleSelectTrack} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 pointer-events-none"
          >
            <div className="pointer-events-auto max-w-md mx-auto bg-black/35 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-3 flex items-center gap-3 shadow-2xl shadow-black/40">
              <img
                src={track.albumCoverUrl}
                alt={track.albumName}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{track.name}</p>
                <p className="text-[11px] text-white/55 truncate">{track.artist}</p>
                <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-white/70 transition-[width] duration-150 ease-linear"
                    style={{ width: `${Math.min(100, progress * 100)}%` }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={togglePlay}
                disabled={!audioReady}
                className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg disabled:opacity-50 cursor-pointer"
                aria-label={playing ? '暂停' : '播放'}
              >
                {playing ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 cursor-pointer"
                aria-label="换一首"
                title="换一首"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10l-3-3m3 3l3-3M21 7v10m0 0l-3-3m3 3l3-3" />
                </svg>
              </button>
            </div>

            {audioError && (
              <p className="mt-2 text-center text-rose-300 text-xs">{audioError}</p>
            )}
            <p className="mt-2 text-center text-white/30 text-[10px] tracking-wider">
              封面取色驱动柔和光晕 · 随鼓点呼吸 · 30 秒 Apple Music 试听
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────
// Track picker overlay
// ───────────────────────────────────────────────────────────────────────────

interface TrackPickerProps {
  onPick: (t: AppleTrack) => void
}

function TrackPicker({ onPick }: TrackPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AppleTrack[]>([])
  const [randomTracks, setRandomTracks] = useState<AppleTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [randomLoading, setRandomLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchRandom = useCallback(async () => {
    setRandomLoading(true)
    try {
      const t = await getRandomAppleTracks()
      setRandomTracks(t)
    } catch {
      setRandomTracks([])
    } finally {
      setRandomLoading(false)
    }
  }, [])

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const t = await searchAppleTracks(q)
      setResults(t)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRandom()
  }, [fetchRandom])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (query.trim()) runSearch(query)
    }, 360)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  const display = useMemo(
    () => (query.trim() ? results : randomTracks),
    [query, results, randomTracks]
  )
  const isLoading = query.trim() ? loading : randomLoading

  return (
    <div className="bg-black/45 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/50">
      <div className="text-center mb-4">
        <h2 className="text-lg sm:text-xl font-semibold mb-1">挑一首歌</h2>
        <p className="text-white/50 text-xs">音乐响起，渐变与光晕随节奏流动</p>
      </div>

      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索歌曲、歌手或专辑…"
          className="w-full pl-9 pr-3 py-2.5 bg-white/8 border border-white/10 rounded-2xl text-sm text-white placeholder-white/40 outline-none focus:border-indigo-300/50 focus:bg-white/12 transition-all"
          autoComplete="off"
          inputMode="search"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {!query.trim() && (
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-white/45 text-[11px]">为你随机挑选</p>
          <button
            type="button"
            onClick={fetchRandom}
            className="text-indigo-300 text-[11px] hover:text-indigo-200 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            换一批
          </button>
        </div>
      )}

      <div className="max-h-[44vh] overflow-y-auto -mx-1 px-1 space-y-1.5">
        {isLoading && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && display.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.3) }}
            onClick={() => onPick(t)}
            disabled={!t.previewUrl}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white/4 hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <img
              src={t.albumCoverUrl}
              alt={t.albumName}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-medium truncate">{t.name}</p>
              <p className="text-white/50 text-[11px] truncate">{t.artist}</p>
            </div>
            <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        ))}
        {!isLoading && query.trim() && results.length === 0 && (
          <p className="text-center text-white/40 py-6 text-sm">没有找到，试试别的关键词</p>
        )}
      </div>
    </div>
  )
}
