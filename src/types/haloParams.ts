/**
 * Tweakable WebGPU bloom / glass-orbit look. Defaults are intentionally soft;
 * use sliders to bring back punch or extra motion.
 */
export interface HaloParams {
  /** 0.15–1.2, overall orb stack brightness */
  orbGain: number
  /** 0.8–2.2, &gt;1 = wider/softer falloff (more “bloom”, less hard edge) */
  blobSoft: number
  /** 0.2–1.4, parallax + swirl amount */
  flow: number
  /** 0–1, how much edge darkens toward `background` */
  vigMix: number
  /** 0–1.2, centre radial “sheen” / spec */
  sheen: number
  /** 0.75–1.3, post contrast stretch (lower = flatter) */
  contrast: number
  /** 0–1.2, film grain */
  grain: number
  /** 0–1, luma “pop” in post (lower = gentler) */
  lift: number
}

/** Softer, pastel-friendly default (also used on first visit). */
export const DEFAULT_HALO_PARAMS: HaloParams = {
  orbGain: 0.48,
  blobSoft: 1.5,
  flow: 0.62,
  vigMix: 0.32,
  sheen: 0.3,
  contrast: 0.9,
  grain: 0.55,
  lift: 0.42,
}

export const BOLD_PRESET: HaloParams = {
  orbGain: 0.78,
  blobSoft: 1.1,
  flow: 0.95,
  vigMix: 0.55,
  sheen: 0.6,
  contrast: 1.1,
  grain: 0.85,
  lift: 0.85,
}

const STORAGE_KEY = 'music-card-bloom-halo-v1'

export function loadHaloParams(): HaloParams {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_HALO_PARAMS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_HALO_PARAMS }
    const parsed = JSON.parse(raw) as Partial<HaloParams>
    return { ...DEFAULT_HALO_PARAMS, ...parsed }
  } catch {
    return { ...DEFAULT_HALO_PARAMS }
  }
}

export function saveHaloParams(p: HaloParams): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // ignore quota / private mode
  }
}
