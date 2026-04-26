export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  albumName: string
  albumCoverUrl: string
  previewUrl: string | null
  spotifyUri: string
  durationMs: number
}

export interface ColorPalette {
  primary: [number, number, number]
  secondary: [number, number, number]
  accent: [number, number, number]
  background: [number, number, number]
  text: [number, number, number]
  colors: Array<[number, number, number]>
}

export type TemplateType = 'particle' | 'gradient' | 'aurora' | 'vinyl' | 'crystal'

export interface CardData {
  t: string    // Spotify track ID
  tp: TemplateType
  m?: string   // greeting message
  f?: string   // sender name
  to?: string  // recipient name (shown on cover)
  ct?: string  // cover title (e.g. "致 XXX 的一封信")
}

export interface CardState {
  track: SpotifyTrack | null
  template: TemplateType
  message: string
  senderName: string
  recipientName: string
  coverTitle: string
  palette: ColorPalette | null
  step: number
  setTrack: (track: SpotifyTrack) => void
  setTemplate: (template: TemplateType) => void
  setMessage: (message: string) => void
  setSenderName: (name: string) => void
  setRecipientName: (name: string) => void
  setCoverTitle: (title: string) => void
  setPalette: (palette: ColorPalette) => void
  setStep: (step: number) => void
  reset: () => void
}

export interface TemplateProps {
  palette: ColorPalette
  track: SpotifyTrack
  message?: string
  senderName?: string
  isPreview?: boolean
}

export const TEMPLATE_INFO: Record<TemplateType, { name: string; description: string }> = {
  particle: { name: '星辰粒子', description: '粒子星系漩涡动画' },
  gradient: { name: '流光波纹', description: '渐变波纹玻璃质感' },
  aurora: { name: '极光幻境', description: '极光着色器光带效果' },
  vinyl: { name: '黑胶唱片', description: '3D旋转黑胶唱片' },
  crystal: { name: '水晶棱镜', description: '折射水晶体旋转' },
}
