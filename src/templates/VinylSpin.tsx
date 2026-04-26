import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TemplateProps } from '../types'

function rgb(c: [number, number, number]) {
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

export default function VinylSpin({ palette, track, message, senderName, isPreview }: TemplateProps) {
  const grooves = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => 55 + i * 2)
  }, [])

  const bg = `radial-gradient(ellipse at 30% 30%, ${rgb(palette.primary)}22 0%, transparent 50%), 
              radial-gradient(ellipse at 70% 70%, ${rgb(palette.secondary)}22 0%, transparent 50%), 
              #0a0a12`

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden flex items-center justify-center" style={{ background: bg }}>
      {/* Vinyl record */}
      <motion.div
        className="relative"
        style={{ width: isPreview ? 180 : 280, height: isPreview ? 180 : 280 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        {/* Record body */}
        <div
          className="absolute inset-0 rounded-full shadow-2xl"
          style={{
            background: `radial-gradient(circle, ${rgb(palette.primary)}33 0%, #111 20%, #1a1a1a 40%, #111 60%, #1a1a1a 80%, #111 100%)`,
          }}
        >
          {/* Grooves */}
          {grooves.map((size, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/5"
              style={{
                width: `${size}%`,
                height: `${size}%`,
                left: `${(100 - size) / 2}%`,
                top: `${(100 - size) / 2}%`,
              }}
            />
          ))}

          {/* Reflection */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
            }}
          />
        </div>

        {/* Center label with album art */}
        <div
          className="absolute rounded-full overflow-hidden shadow-inner border-2 border-white/10"
          style={{
            width: '38%',
            height: '38%',
            left: '31%',
            top: '31%',
          }}
        >
          <motion.img
            src={track.albumCoverUrl}
            alt={track.albumName}
            className="w-full h-full object-cover"
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Spindle hole */}
        <div
          className="absolute rounded-full bg-[#0a0a12]"
          style={{
            width: '4%',
            height: '4%',
            left: '48%',
            top: '48%',
          }}
        />
      </motion.div>

      {/* Track info overlay */}
      {!isPreview && (
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center z-10">
          <p className="text-white font-bold text-xl drop-shadow-lg">{track.name}</p>
          <p className="text-white/60 text-sm mt-1">{track.artist}</p>
          {message && (
            <p className="text-white/80 text-center mt-4 max-w-xs text-sm italic">
              "{message}"
            </p>
          )}
          {senderName && (
            <p className="text-white/50 text-sm mt-2">—— {senderName}</p>
          )}
        </div>
      )}

      {/* Tonearm (non-preview only) */}
      {!isPreview && (
        <motion.div
          className="absolute top-8 right-8 origin-top-right z-5"
          initial={{ rotate: -30 }}
          animate={{ rotate: -15 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        >
          <div
            className="w-1 bg-gradient-to-b from-white/40 to-white/10 rounded-full"
            style={{ height: 120 }}
          />
          <div className="w-3 h-3 bg-white/30 rounded-full -ml-1 -mt-1" />
        </motion.div>
      )}
    </div>
  )
}
