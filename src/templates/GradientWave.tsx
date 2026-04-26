import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TemplateProps } from '../types'

function rgb(c: [number, number, number]) {
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

function rgba(c: [number, number, number], a: number) {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`
}

export default function GradientWave({ palette, track, message, senderName, isPreview }: TemplateProps) {
  const notes = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 8 + Math.random() * 16,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
    }))
  }, [])

  const bg = `linear-gradient(135deg, ${rgb(palette.primary)}, ${rgb(palette.secondary)}, ${rgb(palette.accent)})`

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden" style={{ background: bg }}>
      {/* Animated wave layers */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at ${30 + i * 20}% ${40 + i * 10}%, ${rgba(palette.colors[i % palette.colors.length], 0.4)} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
            x: [0, 30 * (i % 2 === 0 ? 1 : -1), 0],
            y: [0, 20 * (i % 2 === 0 ? -1 : 1), 0],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Floating notes */}
      {notes.map((note) => (
        <motion.div
          key={note.id}
          className="absolute text-white/20 select-none pointer-events-none"
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            fontSize: note.size,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            rotate: [-15, 15, -15],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: note.duration,
            delay: note.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          ♪
        </motion.div>
      ))}

      {/* Glass card */}
      {!isPreview && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 max-w-xs w-full mx-4 shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <img
                src={track.albumCoverUrl}
                alt={track.albumName}
                className="w-32 h-32 rounded-2xl shadow-xl mb-5"
              />
              <p className="text-white font-bold text-xl text-center">{track.name}</p>
              <p className="text-white/70 text-sm mt-1">{track.artist}</p>
              {message && (
                <p className="text-white/90 text-center mt-5 text-sm leading-relaxed">
                  {message}
                </p>
              )}
              {senderName && (
                <p className="text-white/50 text-sm mt-3">—— {senderName}</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
