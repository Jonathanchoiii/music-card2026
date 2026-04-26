import type { CardData } from '../types'

export function encodeCard(data: CardData): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
}

export function decodeCard(hash: string): CardData | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(hash))))
  } catch {
    return null
  }
}

export function buildShareUrl(data: CardData): string {
  const encoded = encodeCard(data)
  return `${window.location.origin}/card#${encoded}`
}
