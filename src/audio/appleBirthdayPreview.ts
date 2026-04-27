/**
 * 直连 iTunes Search API，获取 Looloo Kids《Happy Birthday》~30s 试听片段，循环播放。
 * 优先匹配 Looloo Kids 版本，未找到时回退到任意 Happy Birthday 试听片段。
 * 若网络不可用或均无结果，回退到本地 Web Audio 弦乐版。
 *
 * iTunes Search API 支持 CORS，前端可直接调用，无需自建后端。
 */
import type { MusicBoxController } from './happyBirthdayMusicBox'
import { createHappyBirthdayMusicBox } from './happyBirthdayMusicBox'

interface ItunesResult {
  trackName: string
  artistName: string
  previewUrl: string | null
}

async function searchItunes(term: string, country = 'us'): Promise<ItunesResult | null> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25&country=${country}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.results?.find(
    (it: ItunesResult) =>
      it.previewUrl &&
      /happy/i.test(it.trackName) &&
      /birthday/i.test(it.trackName),
  ) || null
}

async function findPreviewUrl(): Promise<{ url: string; trackName: string; artistName: string } | null> {
  // 优先搜索 Looloo Kids 版本（多国家区）
  const looLooTerms = [
    'Happy Birthday Looloo Kids',
    'Happy Birthday Looloo',
  ]
  const countries = ['us', 'cn', 'gb', 'au']

  for (const term of looLooTerms) {
    for (const country of countries) {
      const hit = await searchItunes(term, country)
      if (hit && /looloo/i.test(hit.artistName)) {
        console.log(`[iTunes] Looloo Kids hit: ${hit.trackName} - ${hit.artistName}`)
        return { url: hit.previewUrl!, trackName: hit.trackName, artistName: hit.artistName }
      }
    }
  }

  // 未找到 Looloo Kids，回退到任意 Happy Birthday 试听
  console.log('[iTunes] Looloo Kids not found, falling back to generic search')
  const fallbackTerms = ['Happy Birthday Traditional', 'Happy Birthday To You', 'Happy Birthday']
  for (const term of fallbackTerms) {
    for (const country of countries) {
      const hit = await searchItunes(term, country)
      if (hit) {
        console.log(`[iTunes] Fallback hit: ${hit.trackName} - ${hit.artistName}`)
        return { url: hit.previewUrl!, trackName: hit.trackName, artistName: hit.artistName }
      }
    }
  }

  return null
}

export function createAppleHappyBirthdayPreviewPlayer(): MusicBoxController {
  let audio: HTMLAudioElement | null = null
  let fallback: MusicBoxController | null = null
  let muted = false
  let disposed = false
  let bootStarted = false

  const applyMute = () => {
    if (audio) audio.muted = muted
    if (fallback) fallback.setMuted(muted)
  }

  const boot = async () => {
    if (bootStarted || disposed) return
    bootStarted = true

    try {
      const result = await findPreviewUrl()
      if (!result) throw new Error('no previewUrl')
      if (disposed) return

      audio = new Audio(result.url)
      audio.loop = true
      audio.volume = 0.45
      audio.muted = muted
      audio.preload = 'auto'
      void audio.play().catch(() => {
        /* 自动播放策略：等待用户手势后 tryResume */
      })
    } catch {
      if (disposed) return
      fallback = createHappyBirthdayMusicBox()
      fallback.start()
      fallback.setMuted(muted)
    }
  }

  return {
    start: () => {
      void boot()
    },
    tryResume: () => {
      void audio?.play()
      fallback?.tryResume()
    },
    setMuted: (m: boolean) => {
      muted = m
      applyMute()
    },
    isMuted: () => muted,
    stop: () => {
      disposed = true
      audio?.pause()
      if (audio) {
        audio.removeAttribute('src')
        audio.load()
      }
      audio = null
      fallback?.stop()
      fallback = null
    },
  }
}
