import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { decodeCard } from '../services/cardEncoder'
import { getTrack } from '../services/spotify'
import { extractPalette } from '../services/colorExtract'
import { saveCardAsImage } from '../services/saveImage'
import MusicPlayer from '../components/MusicPlayer'
import FoldableCard from '../components/FoldableCard'
import type { SpotifyTrack, ColorPalette, TemplateType } from '../types'

import ParticleGalaxy from '../templates/ParticleGalaxy'
import GradientWave from '../templates/GradientWave'
import ShaderAurora from '../templates/ShaderAurora'
import VinylSpin from '../templates/VinylSpin'
import CrystalPrism from '../templates/CrystalPrism'

function FullTemplate({ type, ...props }: { type: TemplateType } & Parameters<typeof ParticleGalaxy>[0]) {
  switch (type) {
    case 'particle': return <ParticleGalaxy {...props} />
    case 'gradient': return <GradientWave {...props} />
    case 'aurora': return <ShaderAurora {...props} />
    case 'vinyl': return <VinylSpin {...props} />
    case 'crystal': return <CrystalPrism {...props} />
    default: return <ParticleGalaxy {...props} />
  }
}

export default function View() {
  const location = useLocation()
  const navigate = useNavigate()
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [palette, setPalette] = useState<ColorPalette | null>(null)
  const [templateType, setTemplateType] = useState<TemplateType>('particle')
  const [message, setMessage] = useState('')
  const [senderName, setSenderName] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [coverTitle, setCoverTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpened, setIsOpened] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hash = location.hash.slice(1)
    if (!hash) {
      setError('无效的贺卡链接')
      setLoading(false)
      return
    }

    const cardData = decodeCard(hash)
    if (!cardData) {
      setError('无法解析贺卡数据')
      setLoading(false)
      return
    }

    setTemplateType(cardData.tp)
    if (cardData.m) setMessage(cardData.m)
    if (cardData.f) setSenderName(cardData.f)
    if (cardData.to) setRecipientName(cardData.to)
    if (cardData.ct) setCoverTitle(cardData.ct)

    async function loadCard() {
      try {
        const t = await getTrack(cardData!.t)
        setTrack(t)
        const p = await extractPalette(t.albumCoverUrl)
        setPalette(p)
      } catch {
        setError('加载贺卡失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    loadCard()
  }, [location.hash])

  // After the card opens, slide the music player up so it's discoverable
  // (and so its iframe gets a chance to autoplay).
  useEffect(() => {
    if (!isOpened) return
    const id = setTimeout(() => setShowControls(true), 800)
    return () => clearTimeout(id)
  }, [isOpened])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50">正在为你加载贺卡...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !track || !palette) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-white/70 text-xl mb-4">{error || '出错了'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-500 rounded-xl text-white hover:bg-indigo-600 transition-colors"
          >
            制作自己的贺卡
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <FoldableCard
      palette={palette}
      track={track}
      recipientName={recipientName}
      coverTitle={coverTitle}
      senderName={senderName}
      onOpened={() => setIsOpened(true)}
    >
      <div
        className="absolute inset-0"
        onClick={() => isOpened && setShowControls((s) => !s)}
      >
        <div ref={cardRef} id="card-capture-view" className="absolute inset-0">
          <FullTemplate
            type={templateType}
            palette={palette}
            track={track}
            message={message}
            senderName={senderName}
          />
        </div>

        {/* Always-mounted Spotify embed once opened (kept hidden when controls collapsed
            so autoplay can fire as soon as the card opens). */}
        {isOpened && (
          <div
            className="absolute"
            style={{
              left: showControls ? 0 : -9999,
              right: showControls ? 0 : 'auto',
              bottom: 0,
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
              zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-t from-black/85 via-black/50 to-transparent">
              <MusicPlayer trackId={track.id} compact autoPlay />
              <div className="flex gap-3 mt-4 justify-center">
                <button
                  onClick={() => {
                    const el = document.getElementById('card-capture-view')
                    if (el) saveCardAsImage(el)
                  }}
                  className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl text-white text-sm hover:bg-white/20 transition-all border border-white/10"
                >
                  保存图片
                </button>
                <button
                  onClick={() => navigate('/create')}
                  className="px-5 py-2.5 bg-indigo-500/80 backdrop-blur-sm rounded-xl text-white text-sm hover:bg-indigo-500 transition-all"
                >
                  制作我的贺卡
                </button>
              </div>
            </div>
          </div>
        )}

        {isOpened && !showControls && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-6 left-0 right-0 text-center text-white/30 text-xs z-10 pointer-events-none"
          >
            点击屏幕显示控制栏
          </motion.p>
        )}
      </div>
    </FoldableCard>
  )
}
