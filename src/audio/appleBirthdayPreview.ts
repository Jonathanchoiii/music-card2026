import type { MusicBoxController } from './happyBirthdayMusicBox'
import { createHappyBirthdayMusicBox } from './happyBirthdayMusicBox'

/**
 * 通过自建 API 拉取 iTunes / Apple Music 目录里的约 30 秒试听片段 URL，用 HTMLAudioElement 循环播放。
 * 若网络或目录无结果，回退到本地 Web Audio 弦乐版。
 */
export function createAppleHappyBirthdayPreviewPlayer(): MusicBoxController {
  let audio: HTMLAudioElement | null = null
  let fallback: MusicBoxController | null = null
  let muted = false
  let disposed = false
  let bootStarted = false

  const applyMute = () => {
    if (audio) {
      audio.muted = muted
    }
    if (fallback) {
      fallback.setMuted(muted)
    }
  }

  const boot = async () => {
    if (bootStarted || disposed) return
    bootStarted = true

    try {
      const res = await fetch('/api/apple/birthday-preview')
      if (!res.ok) {
        throw new Error(`birthday-preview ${res.status}`)
      }
      const data = (await res.json()) as { previewUrl?: string }
      if (!data.previewUrl) {
        throw new Error('no previewUrl')
      }
      if (disposed) return

      audio = new Audio(data.previewUrl)
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
