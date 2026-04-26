import type { ColorPalette } from '../types'

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) * 0.5
  let h = 0
  let s = 0
  if (d > 1e-6) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h, s, l }
}

function distSq(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

/**
 * Picks up to 5 *distinct* colors that actually appear on the cover, prioritising
 * saturated pixels. Unlike coarse histogram bucketing, this follows album art
 * when the user picks a non-grey dominant colour.
 */
function pickDistinctColors(
  pixels: Array<{ r: number; g: number; b: number; s: number; l: number; score: number }>,
  count: number,
  minDistance: number
): Array<[number, number, number]> {
  const sorted = [...pixels].sort((a, b) => b.score - a.score)
  const out: Array<[number, number, number]> = []
  const d2 = minDistance * minDistance
  for (const p of sorted) {
    if (p.s < 0.04 && out.length > 0) break
    const c: [number, number, number] = [p.r, p.g, p.b]
    if (out.some((e) => distSq(e, c) < d2)) continue
    out.push(c)
    if (out.length >= count) break
  }
  return out
}

export async function extractPalette(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const size = 128
        canvas.width = size
        canvas.height = size
        ctx.drawImage(img, 0, 0, size, size)
        const imageData = ctx.getImageData(0, 0, size, size).data

        // ── Edge / “album frame” for background (what you see on the real cover) ──
        const border = 2
        let bSum = 0
        let bG = 0
        let bB = 0
        let bCount = 0
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            if (
              x < border ||
              y < border ||
              x >= size - border ||
              y >= size - border
            ) {
              const i = (y * size + x) * 4
              bSum += imageData[i]
              bG += imageData[i + 1]
              bB += imageData[i + 2]
              bCount++
            }
          }
        }
        const edgeAvg: [number, number, number] = bCount
          ? [bSum / bCount, bG / bCount, bB / bCount]
          : [20, 18, 28]

        // Per-pixel: score by saturation and avoid pure black/white
        const samples: Array<{
          r: number
          g: number
          b: number
          s: number
          l: number
          score: number
        }> = []
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            if (
              x < border ||
              y < border ||
              x >= size - border ||
              y >= size - border
            )
              continue
            const i = (y * size + x) * 4
            const a = imageData[i + 3] / 255
            if (a < 0.05) continue
            const r = imageData[i]
            const g = imageData[i + 1]
            const b = imageData[i + 2]
            const { s, l } = rgbToHsl(r, g, b)
            if (l < 0.02 || l > 0.99) continue
            // Prefer colourful mid-tones; still allow dark saturated regions (e.g. album on black)
            const pop = s * s * (0.4 + 0.6 * (1 - Math.abs(l - 0.45)))
            const score = pop * (0.15 + 0.85 * s)
            samples.push({ r, g, b, s, l, score })
          }
        }

        if (samples.length === 0) {
          resolve(fallbackPalette())
          return
        }

        // Region means (3×3 grid of interior) to capture e.g. top vs bottom of cover art
        const regions: [number, number, number][] = []
        const rborder = 4
        const cellW = (size - rborder * 2) / 3
        for (let cy = 0; cy < 3; cy++) {
          for (let cx = 0; cx < 3; cx++) {
            const x0 = Math.floor(rborder + cx * cellW)
            const x1 = Math.floor(rborder + (cx + 1) * cellW)
            const y0 = Math.floor(rborder + cy * cellW)
            const y1 = Math.floor(rborder + (cy + 1) * cellW)
            let rSum = 0
            let gSum = 0
            let bSum = 0
            let n = 0
            for (let y = y0; y < y1; y++) {
              for (let x = x0; x < x1; x++) {
                const i = (y * size + x) * 4
                rSum += imageData[i]
                gSum += imageData[i + 1]
                bSum += imageData[i + 2]
                n++
              }
            }
            if (n > 0) {
              regions.push([rSum / n, gSum / n, bSum / n])
            }
          }
        }

        const regionHsl = regions.map(([r, g, b]) => ({
          rgb: [r, g, b] as [number, number, number],
          ...rgbToHsl(r, g, b),
        }))
        regionHsl.sort((a, b) => b.s * (1 - Math.abs(b.l - 0.5)) - a.s * (1 - Math.abs(a.l - 0.5)))

        let distinct = pickDistinctColors(samples, 5, 38)
        if (distinct.length === 0) {
          for (const rh of regionHsl) {
            if (rh.s < 0.08) continue
            distinct.push(rh.rgb)
            if (distinct.length >= 5) break
          }
        }
        // Blend region highlights into palette if they differ
        for (const rh of regionHsl.slice(0, 3)) {
          if (rh.s < 0.12) continue
          const c = rh.rgb
          if (!distinct.some((d) => distSq(d, c) < 50 * 50)) {
            if (distinct.length < 5) distinct.push(c)
            else {
              let minS = 2
              let wi = 0
              for (let i = 0; i < distinct.length; i++) {
                const { s: si } = rgbToHsl(
                  distinct[i][0]!,
                  distinct[i][1]!,
                  distinct[i][2]!
                )
                if (si < minS) {
                  minS = si
                  wi = i
                }
              }
              if (rh.s > minS + 0.05) distinct[wi] = c
            }
            break
          }
        }

        // Darkest smear for background (vinyl/lettering) mixed with edge
        const sortedByL = [...samples].sort(
          (a, b) => luminance(a.r, a.g, a.b) - luminance(b.r, b.g, b.b)
        )
        const bottom = sortedByL.slice(0, Math.max(24, (samples.length * 0.12) | 0))
        let dR = 0
        let dG = 0
        let dB = 0
        for (const p of bottom) {
          dR += p.r
          dG += p.g
          dB += p.b
        }
        const nDark = bottom.length || 1
        const deep: [number, number, number] = [
          dR / nDark,
          dG / nDark,
          dB / nDark,
        ]
        const background: [number, number, number] = [
          edgeAvg[0] * 0.35 + deep[0] * 0.65,
          edgeAvg[1] * 0.35 + deep[1] * 0.65,
          edgeAvg[2] * 0.35 + deep[2] * 0.65,
        ]

        while (distinct.length < 5) {
          const g = 38 + distinct.length * 7
          distinct.push(
            [g, g, g] as [number, number, number] // rare; UI still works
          )
        }
        if (distinct.length < 1) {
          resolve(fallbackPalette())
          return
        }

        // Order colors[0..4]: strongest hue → mesh corners; 4th/5th for highlights
        const order = distinct
          .map((c) => {
            const { s, l } = rgbToHsl(c[0], c[1], c[2])
            return { c, s, l, score: s * (0.3 + 0.7 * (1 - Math.abs(l - 0.4))) }
          })
          .sort((a, b) => b.score - a.score)
          .map((x) => x.c)
          .slice(0, 5)

        const primary = order[0]!
        const secondary = order[1]!
        const accent = order[2]!
        const brightest = [...samples].sort(
          (a, b) => luminance(b.r, b.g, b.b) - luminance(a.r, a.g, a.b)
        )[0]
        const text: [number, number, number] = brightest
          ? (luminance(brightest.r, brightest.g, brightest.b) > 140
              ? [brightest.r, brightest.g, brightest.b]
              : [245, 245, 250])
          : [240, 240, 240]

        resolve({
          primary,
          secondary,
          accent,
          background,
          text,
          colors: order,
        })
      } catch {
        resolve(fallbackPalette())
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

function fallbackPalette(): ColorPalette {
  return {
    primary: [99, 102, 241],
    secondary: [168, 85, 247],
    accent: [236, 72, 153],
    background: [15, 15, 30],
    text: [240, 240, 240],
    colors: [
      [99, 102, 241],
      [168, 85, 247],
      [236, 72, 153],
      [45, 40, 70],
      [120, 100, 200],
    ],
  }
}
