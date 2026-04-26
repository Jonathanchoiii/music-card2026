import { useCallback, useEffect, useRef } from 'react'

export interface AudioFeatures {
  bass: number    // 0..1, smoothed
  mid: number     // 0..1, smoothed
  treble: number  // 0..1, smoothed
  level: number   // overall RMS-ish, 0..1
  beat: number    // 0..1, transient kick (decays fast)
}

interface InternalState {
  ctx: AudioContext | null
  analyser: AnalyserNode | null
  source: MediaElementAudioSourceNode | null
  data: Uint8Array<ArrayBuffer> | null
  // smoothed values
  sBass: number
  sMid: number
  sTreble: number
  sLevel: number
  // beat detection
  bassBaseline: number
  beatEnv: number
}

/**
 * Wires an HTMLAudioElement into a WebAudio AnalyserNode and exposes a
 * `sample()` function that returns smoothed bass / mid / treble bands plus
 * a transient `beat` envelope. The analyser is created lazily on the first
 * call to `resume()` (required because AudioContexts must be unlocked by a
 * user gesture).
 */
export function useAudioAnalyser(audio: HTMLAudioElement | null) {
  const ref = useRef<InternalState>({
    ctx: null,
    analyser: null,
    source: null,
    data: null,
    sBass: 0,
    sMid: 0,
    sTreble: 0,
    sLevel: 0,
    bassBaseline: 0,
    beatEnv: 0,
  })

  // Lazy init on first user-gesture-triggered resume()
  const ensureGraph = useCallback(() => {
    if (!audio) return null
    const s = ref.current
    if (s.ctx) return s.ctx

    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()
    // MediaElementSource can only be created once per HTMLAudioElement, so
    // we keep the entire graph alive for the lifetime of the audio element.
    const source = ctx.createMediaElementSource(audio)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.7
    source.connect(analyser)
    analyser.connect(ctx.destination)

    s.ctx = ctx
    s.source = source
    s.analyser = analyser
    s.data = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
    return ctx
  }, [audio])

  const resume = useCallback(async () => {
    const ctx = ensureGraph()
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        // ignore — the next gesture will retry
      }
    }
  }, [ensureGraph])

  const sample = useCallback((): AudioFeatures => {
    const s = ref.current
    if (!s.analyser || !s.data) {
      return { bass: 0, mid: 0, treble: 0, level: 0, beat: 0 }
    }
    s.analyser.getByteFrequencyData(s.data)
    const data = s.data
    const sampleRate = s.ctx?.sampleRate ?? 44100
    const fftSize = s.analyser.fftSize
    // Bin frequency = i * sampleRate / fftSize
    const binHz = sampleRate / fftSize

    // Band ranges (Hz)
    const bands = {
      bass: [30, 180] as const,
      mid: [180, 1800] as const,
      treble: [1800, 8000] as const,
    }
    const energy = (lo: number, hi: number) => {
      const a = Math.max(1, Math.floor(lo / binHz))
      const b = Math.min(data.length - 1, Math.floor(hi / binHz))
      let sum = 0
      for (let i = a; i <= b; i++) sum += data[i]
      return sum / (Math.max(1, b - a + 1) * 255)
    }
    const bass = energy(bands.bass[0], bands.bass[1])
    const mid = energy(bands.mid[0], bands.mid[1])
    const treble = energy(bands.treble[0], bands.treble[1])
    const level = bass * 0.55 + mid * 0.3 + treble * 0.15

    // Asymmetric envelope (fast attack, slow release) for soft visual response
    const env = (prev: number, target: number, attack: number, release: number) => {
      const a = target > prev ? attack : release
      return prev + (target - prev) * a
    }
    s.sBass = env(s.sBass, bass, 0.55, 0.12)
    s.sMid = env(s.sMid, mid, 0.45, 0.10)
    s.sTreble = env(s.sTreble, treble, 0.5, 0.18)
    s.sLevel = env(s.sLevel, level, 0.45, 0.10)

    // Beat: track a slow baseline of bass and fire when it spikes ~30% above.
    s.bassBaseline = s.bassBaseline * 0.97 + bass * 0.03
    const fired = bass > s.bassBaseline * 1.3 + 0.05 ? 1 : 0
    s.beatEnv = Math.max(s.beatEnv * 0.86, fired)

    return {
      bass: s.sBass,
      mid: s.sMid,
      treble: s.sTreble,
      level: s.sLevel,
      beat: s.beatEnv,
    }
  }, [])

  // Tear down only when the audio element identity changes (or unmount).
  useEffect(() => {
    return () => {
      const s = ref.current
      try {
        s.source?.disconnect()
        s.analyser?.disconnect()
        s.ctx?.close()
      } catch {
        // ignore
      }
      ref.current = {
        ctx: null,
        analyser: null,
        source: null,
        data: null,
        sBass: 0,
        sMid: 0,
        sTreble: 0,
        sLevel: 0,
        bassBaseline: 0,
        beatEnv: 0,
      }
    }
  }, [audio])

  return { sample, resume }
}
