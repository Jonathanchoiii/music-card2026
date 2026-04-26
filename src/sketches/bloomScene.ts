import * as THREE from 'three/webgpu'
import {
  Fn,
  vec2,
  vec3,
  vec4,
  float,
  sin,
  cos,
  length,
  uv,
  time,
  uniform,
  smoothstep,
  mix,
  pow,
  exp,
  dot,
  fract,
  saturate,
  clamp,
} from 'three/tsl'
import type { ColorPalette } from '../types'
import { DEFAULT_HALO_PARAMS, type HaloParams } from '../types/haloParams'

export interface BloomSceneHandle {
  setSize: (width: number, height: number, dpr: number) => void
  setPalette: (palette: ColorPalette) => void
  setHaloParams: (p: Partial<HaloParams>) => void
  setAudio: (f: { bass: number; mid: number; treble: number; level: number; beat: number }) => void
  setIdle: (idle: boolean) => void
  start: () => void
  stop: () => void
  dispose: () => void
}

const DEFAULT_PALETTE: ColorPalette = {
  primary: [88, 110, 255],
  secondary: [255, 120, 200],
  accent: [120, 240, 220],
  background: [12, 10, 28],
  text: [245, 245, 250],
  colors: [
    [88, 110, 255],
    [255, 120, 200],
    [120, 240, 220],
    [40, 32, 72],
    [255, 200, 160],
  ],
}

function rgb01(c: [number, number, number]): THREE.Color {
  return new THREE.Color(c[0]! / 255, c[1]! / 255, c[2]! / 255)
}

/**
 * Unicorn-Studio–style: soft 4-point mesh from album colours, gentle warp,
 * drifting glassy glows, film grain, vignette. All hue comes from the cover;
 * audio only moves shape and weight.
 */
export async function createBloomScene(canvas: HTMLCanvasElement): Promise<BloomSceneHandle> {
  const clear = rgb01(DEFAULT_PALETTE.background)
  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(clear, 1)
  await renderer.init()

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const uBass = uniform(0)
  const uMid = uniform(0)
  const uTreble = uniform(0)
  const uLevel = uniform(0)
  const uBeat = uniform(0)
  const uIdle = uniform(0.32)

  const uBackground = uniform(rgb01(DEFAULT_PALETTE.background))
  const uC0 = uniform(rgb01(DEFAULT_PALETTE.colors[0]!))
  const uC1 = uniform(rgb01(DEFAULT_PALETTE.colors[1]!))
  const uC2 = uniform(rgb01(DEFAULT_PALETTE.colors[2]!))
  const uC3 = uniform(rgb01(DEFAULT_PALETTE.colors[3]!))
  const uC4 = uniform(rgb01(DEFAULT_PALETTE.colors[4]!))
  const uResolution = uniform(new THREE.Vector2(1, 1))

  const uOrbGain = uniform(DEFAULT_HALO_PARAMS.orbGain)
  const uBlobSoft = uniform(DEFAULT_HALO_PARAMS.blobSoft)
  const uFlowMul = uniform(DEFAULT_HALO_PARAMS.flow)
  const uVigMix = uniform(DEFAULT_HALO_PARAMS.vigMix)
  const uSheenMul = uniform(DEFAULT_HALO_PARAMS.sheen)
  const uContrast = uniform(DEFAULT_HALO_PARAMS.contrast)
  const uGrainMul = uniform(DEFAULT_HALO_PARAMS.grain)
  const uLift = uniform(DEFAULT_HALO_PARAMS.lift)

  let haloState: HaloParams = { ...DEFAULT_HALO_PARAMS }
  const applyHalo = () => {
    uOrbGain.value = haloState.orbGain
    uBlobSoft.value = haloState.blobSoft
    uFlowMul.value = haloState.flow
    uVigMix.value = haloState.vigMix
    uSheenMul.value = haloState.sheen
    uContrast.value = haloState.contrast
    uGrainMul.value = haloState.grain
    uLift.value = haloState.lift
  }
  applyHalo()

  const colorNode = Fn(() => {
    const aspect = uResolution.x.div(uResolution.y)
    const st = uv()

    const driveBass = uBass.add(uIdle.mul(0.3))
    const driveMid = uMid.add(uIdle.mul(0.22))
    const driveTreble = uTreble.add(uIdle.mul(0.15))
    const driveLevel = uLevel.add(uIdle.mul(0.24))

    const t = time

    const p = st.sub(0.5).mul(vec2(aspect, 1).mul(2.0))

    const w = driveBass.mul(0.55).add(0.1)
    const wu = st.x
      .add(sin(st.y.mul(6.28).add(t.mul(0.4))).mul(0.028))
      .add(w.mul(0.05).mul(sin(t.mul(0.6))))
    const wv = st.y
      .add(cos(st.x.mul(5.2).sub(t.mul(0.33))).mul(0.028))
      .add(w.mul(0.05).mul(cos(t.mul(0.5))))
    const uu = clamp(wu, 0, 1)
    const vv = clamp(wv, 0, 1)

    const top = mix(uC0, uC1, uu)
    const bottom = mix(uC2, uC3, uu)
    const base = mix(top, bottom, vv)

    const flow = t.mul(0.15).add(driveBass.mul(0.4))
    const wobble = sin(uu.mul(3.1).add(vv.mul(2.7)).add(flow)).mul(0.5).add(0.5)
    const depth = mix(uC0, uC2, wobble)
    const blended = mix(
      base,
      depth,
      float(0.18).add(driveMid.mul(0.12))
    )

    // Coordinates with slow drift (parallax) for layered orbs — `uFlowMul` from panel
    const drift = vec2(
      sin(t.mul(0.19)).mul(0.12),
      cos(t.mul(0.14)).mul(0.1)
    )
      .add(
        vec2(
          sin(t.mul(0.11).add(2.0)).mul(driveBass.mul(0.1)),
          cos(t.mul(0.13).sub(0.5)).mul(driveBass.mul(0.08))
        )
      )
      .mul(uFlowMul)
    const pFlow = p.add(drift)
    const swirl = vec2(
      sin(p.y.mul(2.1).add(t.mul(0.5))).mul(0.05),
      cos(p.x.mul(1.8).sub(t.mul(0.42))).mul(0.05)
    )
      .mul(driveMid.add(0.25))
      .mul(uFlowMul)
    const pO = pFlow.add(swirl)

    const beatBoost = float(1).add(uBeat.mul(0.45))
    const lvl = float(0.45).add(driveLevel.mul(0.5))

    // L1: large main glow (C4)
    const c1 = vec2(
      sin(t.mul(0.36)).mul(0.5),
      cos(t.mul(0.31).add(0.4)).mul(0.45)
    )
    const w1 = lvl.mul(0.55).mul(beatBoost)
    const o1 = uC4.mul(
      exp(length(pO.sub(c1)).mul(-2.0).div(uBlobSoft)).mul(w1)
    )

    // L2: Lissajous path (C1)
    const c2 = vec2(
      sin(t.mul(0.48).add(1.0)).mul(0.38),
      sin(t.mul(0.32)).mul(0.4)
    )
    const w2 = lvl.mul(0.42)
    const o2 = uC1.mul(
      exp(length(pO.sub(c2)).mul(-2.5).div(uBlobSoft)).mul(w2)
    )

    // L3: fast smaller highlight (C2) — 随 mid 外扩
    const c3 = vec2(
      cos(t.mul(0.62).sub(0.7)).mul(0.5).add(driveMid.mul(0.12)),
      sin(t.mul(0.55)).mul(0.42)
    )
    const w3 = float(0.4).add(driveTreble.mul(0.35))
    const o3 = uC2.mul(
      exp(length(pO.sub(c3)).mul(-3.3).div(uBlobSoft)).mul(w3).mul(beatBoost)
    )

    // L4: slow big soft wash (C0), low frequency
    const c4 = vec2(
      cos(t.mul(0.18).add(2.1)).mul(0.55),
      sin(t.mul(0.16)).mul(0.48)
    )
    const w4 = float(0.28).add(driveLevel.mul(0.2))
    const o4 = uC0.mul(
      exp(length(pO.sub(c4)).mul(-1.25).div(uBlobSoft)).mul(w4)
    )

    // L5: elliptical “lens” streak (C3)
    const c5 = vec2(
      sin(t.mul(0.41).add(0.2)).mul(0.4),
      cos(t.mul(0.37).mul(1.3)).mul(0.5)
    )
    const r5 = pO.sub(c5)
    const dEl = length(vec2(r5.x.mul(1.35), r5.y.mul(0.72)))
    const w5 = float(0.38).add(uBeat.mul(0.25))
    const o5 = uC3.mul(
      exp(dEl.mul(-2.2).div(uBlobSoft)).mul(w5).mul(beatBoost)
    )

    // L6: counter-rotating micro orb (C4)
    const c6 = vec2(
      cos(t.mul(-0.5).add(1.7)).mul(0.3),
      sin(t.mul(-0.44)).mul(0.35)
    )
    const w6 = float(0.32).add(driveTreble.mul(0.25))
    const o6 = uC4.mul(
      exp(length(pO.sub(c6)).mul(-3.8).div(uBlobSoft)).mul(w6)
    )

    // L7: 远处柔光
    const c7 = vec2(
      sin(t.mul(0.24).add(0.3)).mul(0.6),
      cos(t.mul(0.2)).mul(0.55)
    )
    const w7 = float(0.22)
    const o7 = uC1
      .mul(
        exp(length(pO.sub(c7)).mul(-1.1).div(uBlobSoft)).mul(w7).mul(0.7)
      )
      .add(
        uC2.mul(
          exp(length(pO.sub(c7)).mul(-0.9).div(uBlobSoft)).mul(0.15)
        )
      )

    const orbSum = o1
      .add(o2)
      .add(o3)
      .add(o4)
      .add(o5)
      .add(o6)
      .add(o7)
      .mul(uOrbGain)
    const withOrbs = blended.add(orbSum)

    const r = length(p)
    const sheen = exp(r.mul(-0.9).div(uBlobSoft))
      .mul(uC4)
      .mul(pow(driveTreble.add(0.15), 1.2))
      .mul(float(0.45).add(uBeat.mul(0.55)))
    const withSheen = withOrbs.add(sheen.mul(0.48).mul(uSheenMul))

    // 暗角：`uVigMix` 低 = 几乎不压边（更柔和）
    const vigCore = float(1).sub(smoothstep(0.28, 1.4, r.mul(0.92)))
    const vig = mix(float(1), vigCore, uVigMix)
    const vigged = mix(uBackground, withSheen, vig)

    const pulse = float(1).add(uBeat.mul(0.12)).add(driveLevel.mul(0.05))
    const pulsed = vigged.mul(pulse)

    // Film grain
    const gco = st.mul(900.0)
    const n = fract(sin(dot(gco, vec2(12.9898, 78.233))).mul(43758.5453))
    const grain = n
      .sub(0.5)
      .mul(0.04)
      .mul(driveTreble.add(0.25))
      .mul(uGrainMul)
    const noised = pulsed.add(vec3(1, 1, 1).mul(grain))

    const cAmt = float(1).add(
      float(0.26).add(driveMid.mul(0.16)).mul(uContrast)
    )
    const tight = noised.sub(0.5).mul(cAmt).add(0.5)
    const s1 = saturate(tight)
    const lum = s1.r.mul(0.299).add(s1.g.mul(0.587)).add(s1.b.mul(0.114))
    const lift = lum
      .sub(0.5)
      .mul(0.08)
      .mul(uLift)
    const grained = s1.add(vec3(lift, lift, lift))

    return vec4(saturate(grained), float(1))
  })()

  const material = new THREE.MeshBasicNodeMaterial()
  material.colorNode = colorNode
  const geometry = new THREE.PlaneGeometry(2, 2)
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  let running = false
  const tick = () => {
    if (!running) return
    renderer.renderAsync(scene, camera)
  }
  const start = () => {
    if (running) return
    running = true
    renderer.setAnimationLoop(tick)
  }
  const stop = () => {
    if (!running) return
    running = false
    renderer.setAnimationLoop(null)
  }

  const applyClear = (bg: [number, number, number]) => {
    const c = rgb01(bg)
    renderer.setClearColor(c, 1)
  }

  return {
    setSize(width: number, height: number, dpr: number) {
      renderer.setPixelRatio(Math.min(dpr, 2))
      renderer.setSize(width, height, false)
      uResolution.value.set(width, height)
    },
    setPalette(p: ColorPalette) {
      const c = p.colors
      uBackground.value.copy(rgb01(p.background))
      uC0.value.copy(rgb01(c[0] ?? p.primary))
      uC1.value.copy(rgb01(c[1] ?? p.secondary))
      uC2.value.copy(rgb01(c[2] ?? p.accent))
      uC3.value.copy(rgb01(c[3] ?? p.background))
      uC4.value.copy(rgb01(c[4] ?? p.accent))
      applyClear(p.background)
    },
    setHaloParams(p: Partial<HaloParams>) {
      haloState = { ...haloState, ...p }
      applyHalo()
    },
    setAudio({ bass, mid, treble, level, beat }) {
      uBass.value = bass
      uMid.value = mid
      uTreble.value = treble
      uLevel.value = level
      uBeat.value = beat
    },
    setIdle(idle: boolean) {
      uIdle.value = idle ? 0.5 : 0
    },
    start,
    stop,
    dispose() {
      stop()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    },
  }
}
