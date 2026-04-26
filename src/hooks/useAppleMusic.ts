import { useState, useCallback } from 'react'
import type { AppleTrack } from '../types/apple'
import { searchTracks, getRandomTracks } from '../services/appleMusic'

export function useAppleMusicSearch() {
  const [results, setResults] = useState<AppleTrack[]>([])
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

export function useRandomAppleMusic() {
  const [tracks, setTracks] = useState<AppleTrack[]>([])
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
