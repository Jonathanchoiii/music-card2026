import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SpotifyTrack } from '../types'
import { useSpotifySearch, useRandomMusic } from '../hooks/useSpotify'

interface MusicSearchProps {
  onSelect: (track: SpotifyTrack) => void
}

export default function MusicSearch({ onSelect }: MusicSearchProps) {
  const [query, setQuery] = useState('')
  const { results, loading, search } = useSpotifySearch()
  const { tracks: randomTracks, loading: randomLoading, fetchRandom } = useRandomMusic()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchRandom()
  }, [fetchRandom])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (query.trim()) search(query)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  const displayTracks = query.trim() ? results : randomTracks
  const isLoading = query.trim() ? loading : randomLoading

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索歌曲、歌手或专辑..."
          className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 text-lg outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all backdrop-blur-sm"
        />
        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {!query.trim() && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/50 text-sm">为你随机推荐</p>
          <button
            onClick={fetchRandom}
            className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            换一批
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {displayTracks.map((track, i) => (
            <motion.button
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(track)}
              className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group cursor-pointer text-left"
            >
              <img
                src={track.albumCoverUrl}
                alt={track.albumName}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 group-hover:shadow-lg transition-shadow"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{track.name}</p>
                <p className="text-white/50 text-sm truncate">{track.artist} · {track.albumName}</p>
              </div>
              <svg className="w-5 h-5 text-white/20 group-hover:text-indigo-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          ))}
        </div>
      </AnimatePresence>

      {!isLoading && query.trim() && results.length === 0 && (
        <p className="text-center text-white/40 py-8">没有找到相关歌曲，试试其他关键词</p>
      )}
    </div>
  )
}
