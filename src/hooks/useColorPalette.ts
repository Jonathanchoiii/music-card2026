import { useState, useCallback } from 'react'
import type { ColorPalette } from '../types'
import { extractPalette } from '../services/colorExtract'

export function useColorPalette() {
  const [palette, setPalette] = useState<ColorPalette | null>(null)
  const [loading, setLoading] = useState(false)

  const extract = useCallback(async (imageUrl: string) => {
    setLoading(true)
    try {
      const p = await extractPalette(imageUrl)
      setPalette(p)
      return p
    } catch {
      setPalette(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { palette, loading, extract }
}
