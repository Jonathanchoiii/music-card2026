import type { AppleTrack } from '../types/apple'

const BASE = '/api/apple'

export async function searchTracks(query: string): Promise<AppleTrack[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return data.tracks
}

export async function getRandomTracks(): Promise<AppleTrack[]> {
  const res = await fetch(`${BASE}/random`)
  if (!res.ok) throw new Error('Failed to get random tracks')
  const data = await res.json()
  return data.tracks
}

export async function getTrack(id: string): Promise<AppleTrack> {
  const res = await fetch(`${BASE}/track/${id}`)
  if (!res.ok) throw new Error('Failed to get track')
  const data = await res.json()
  return data.track
}
