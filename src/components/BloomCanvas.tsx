import { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react'
import { createBloomScene, type BloomSceneHandle } from '../sketches/bloomScene'
import type { ColorPalette } from '../types'
import { DEFAULT_HALO_PARAMS, type HaloParams } from '../types/haloParams'

export interface BloomCanvasHandle {
  /** Push fresh audio analyser frame into the scene. Cheap, call every frame. */
  pushAudio: (f: { bass: number; mid: number; treble: number; level: number; beat: number }) => void
}

interface BloomCanvasProps {
  palette: ColorPalette | null
  /** When true, audio is silent; the scene runs an idle drive so the bloom keeps moving. */
  idle?: boolean
  /** Live GPU params for orbs / vignette / contrast (see `HaloParams`). */
  haloParams: HaloParams
}

const BloomCanvas = forwardRef<BloomCanvasHandle, BloomCanvasProps>(function BloomCanvas(
  { palette, idle = false, haloParams = DEFAULT_HALO_PARAMS },
  forwardedRef
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneRef = useRef<BloomSceneHandle | null>(null)
  const haloRef = useRef(haloParams)
  haloRef.current = haloParams
  const [unsupported, setUnsupported] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  // Mount the WebGPU scene once. We defer init by one tick so React
  // StrictMode's transient mount→unmount→mount cycle in dev throws away the
  // cancelled run *before* we ever touch the GPU adapter.
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const supportsGPU = typeof navigator !== 'undefined' && 'gpu' in navigator
    if (!supportsGPU) {
      setUnsupported(true)
      return
    }

    let cancelled = false
    let scene: BloomSceneHandle | null = null
    let ro: ResizeObserver | null = null

    const fit = () => {
      if (!scene || !container) return
      const rect = container.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      scene.setSize(w, h, window.devicePixelRatio || 1)
    }

    const startTimer = window.setTimeout(async () => {
      if (cancelled) return
      try {
        const s = await createBloomScene(canvas)
        if (cancelled) {
          s.dispose()
          return
        }
        scene = s
        sceneRef.current = s
        s.setIdle(idle)
        if (palette) s.setPalette(palette)
        s.setHaloParams(haloRef.current)
        fit()
        s.start()
        ro = new ResizeObserver(fit)
        ro.observe(container)
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'WebGPU init failed'
        // eslint-disable-next-line no-console
        console.error('[BloomCanvas]', err)
        setInitError(msg)
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(startTimer)
      ro?.disconnect()
      sceneRef.current = null
      scene?.dispose()
      scene = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push palette changes to the scene without rebuilding it.
  useEffect(() => {
    if (palette && sceneRef.current) sceneRef.current.setPalette(palette)
  }, [palette])

  // Toggle the idle drive when audio playback state changes.
  useEffect(() => {
    sceneRef.current?.setIdle(idle)
  }, [idle])

  useEffect(() => {
    sceneRef.current?.setHaloParams(haloParams)
  }, [haloParams])

  useImperativeHandle(forwardedRef, () => ({
    pushAudio: (f) => {
      sceneRef.current?.setAudio(f)
    },
  }))

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ display: 'block' }}
      />
      {(unsupported || initError) && (
        <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
          <div className="text-center max-w-sm bg-black/40 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 pointer-events-auto">
            <p className="text-white text-sm font-medium mb-1">
              {unsupported ? 'WebGPU 不可用' : 'WebGPU 初始化失败'}
            </p>
            <p className="text-white/60 text-xs leading-relaxed">
              {unsupported
                ? '请使用最新版 Chrome / Edge / Arc，或在 Safari 17+ 中开启 WebGPU 实验功能。'
                : initError}
            </p>
          </div>
        </div>
      )}
    </div>
  )
})

export default BloomCanvas
