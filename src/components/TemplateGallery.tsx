import { motion } from 'framer-motion'
import type { TemplateType, ColorPalette, SpotifyTrack } from '../types'
import { TEMPLATE_INFO } from '../types'
import ParticleGalaxy from '../templates/ParticleGalaxy'
import GradientWave from '../templates/GradientWave'
import ShaderAurora from '../templates/ShaderAurora'
import VinylSpin from '../templates/VinylSpin'
import CrystalPrism from '../templates/CrystalPrism'

interface TemplateGalleryProps {
  palette: ColorPalette
  track: SpotifyTrack
  selected: TemplateType
  onSelect: (t: TemplateType) => void
}

const TEMPLATES: TemplateType[] = ['particle', 'gradient', 'aurora', 'vinyl', 'crystal']

function TemplatePreview({ type, palette, track }: { type: TemplateType; palette: ColorPalette; track: SpotifyTrack }) {
  const props = { palette, track, isPreview: true }
  switch (type) {
    case 'particle': return <ParticleGalaxy {...props} />
    case 'gradient': return <GradientWave {...props} />
    case 'aurora': return <ShaderAurora {...props} />
    case 'vinyl': return <VinylSpin {...props} />
    case 'crystal': return <CrystalPrism {...props} />
  }
}

export default function TemplateGallery({ palette, track, selected, onSelect }: TemplateGalleryProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TEMPLATES.map((type, i) => {
          const info = TEMPLATE_INFO[type]
          const isActive = selected === type
          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(type)}
              className={`relative rounded-2xl overflow-hidden aspect-[3/4] border-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/30 scale-105'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="absolute inset-0">
                <TemplatePreview type={type} palette={palette} track={track} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm font-medium">{info.name}</p>
                <p className="text-white/60 text-xs">{info.description}</p>
              </div>
              {isActive && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
