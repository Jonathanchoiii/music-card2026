import { useState, useCallback } from 'react'
import type { SpotifyTrack } from '../types'
import { searchTracks, getRandomTracks, getTrack } from '../services/spotify'

export function useSpotifySearch() {
  const [results, setResults] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const tracks = await searchTracks(query)
      setResults(tracks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, error, search }
}

export function useRandomMusic() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRandom = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRandomTracks()
      setTracks(data)
    } catch {
      setTracks([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { tracks, loading, fetchRandom }
}

export function useTrack() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTrack = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const data = await getTrack(id)
      setTrack(data)
    } catch {
      setTrack(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return { track, loading, fetchTrack }
}
