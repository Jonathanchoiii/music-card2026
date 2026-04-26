import type { SpotifyTrack } from '../types'

const BASE = '/api/spotify'

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return data.tracks
}

export async function getTrack(id: string): Promise<SpotifyTrack> {
  const res = await fetch(`${BASE}/track/${id}`)
  if (!res.ok) throw new Error('Failed to get track')
  const data = await res.json()
  return data.track
}

export async function getRandomTracks(): Promise<SpotifyTrack[]> {
  const res = await fetch(`${BASE}/random`)
  if (!res.ok) throw new Error('Failed to get random tracks')
  const data = await res.json()
  return data.tracks
}
