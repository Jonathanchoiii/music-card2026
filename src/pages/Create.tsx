import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCardStore } from '../hooks/useCardStore'
import { useColorPalette } from '../hooks/useColorPalette'
import MusicSearch from '../components/MusicSearch'
import TemplateGallery from '../components/TemplateGallery'
import MessageEditor from '../components/MessageEditor'
import SharePanel from '../components/SharePanel'
import MusicPlayer from '../components/MusicPlayer'
import { buildShareUrl } from '../services/cardEncoder'
import { saveCardAsImage } from '../services/saveImage'
import type { SpotifyTrack, CardData } from '../types'

import ParticleGalaxy from '../templates/ParticleGalaxy'
import GradientWave from '../templates/GradientWave'
import ShaderAurora from '../templates/ShaderAurora'
import VinylSpin from '../templates/VinylSpin'
import CrystalPrism from '../templates/CrystalPrism'

const STEPS = ['选择音乐', '选择模板', '添加祝福', '预览分享']

function FullTemplate({ type, ...props }: { type: string } & Parameters<typeof ParticleGalaxy>[0]) {
  switch (type) {
    case 'particle': return <ParticleGalaxy {...props} />
    case 'gradient': return <GradientWave {...props} />
    case 'aurora': return <ShaderAurora {...props} />
    case 'vinyl': return <VinylSpin {...props} />
    case 'crystal': return <CrystalPrism {...props} />
    default: return <ParticleGalaxy {...props} />
  }
}

export default function Create() {
  const navigate = useNavigate()
  const {
    track, template, message, senderName, recipientName, coverTitle, palette, step,
    setTrack, setTemplate, setMessage, setSenderName, setRecipientName, setCoverTitle, setPalette, setStep, reset,
  } = useCardStore()
  const { extract } = useColorPalette()

  const handleSelectTrack = useCallback(async (t: SpotifyTrack) => {
    setTrack(t)
    const p = await extract(t.albumCoverUrl)
    if (p) setPalette(p)
    setStep(1)
  }, [setTrack, extract, setPalette, setStep])

  const shareUrl = track
    ? buildShareUrl({
        t: track.id,
        tp: template,
        m: message || undefined,
        f: senderName || undefined,
        to: recipientName || undefined,
        ct: coverTitle || undefined,
      } as CardData)
    : ''

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button
          onClick={() => {
            if (step > 0) setStep(step - 1)
            else { reset(); navigate('/') }
          }}
          className="text-white/50 hover:text-white flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {step > 0 ? '上一步' : '返回'}
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  i <= step ? 'bg-indigo-500 scale-125' : 'bg-white/20'
                }`}
              />
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < step ? 'bg-indigo-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <span className="text-white/30 text-sm">{STEPS[step]}</span>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">选一首歌</h2>
              <p className="text-white/40 text-center mb-8">搜索你想送的歌曲，或者试试随机推荐</p>
              <MusicSearch onSelect={handleSelectTrack} />
            </motion.div>
          )}

          {step === 1 && track && palette && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">选择模板</h2>
              <p className="text-white/40 text-center mb-8">
                基于 <span className="text-white/70">{track.name}</span> 的封面色调自动配色
              </p>
              <TemplateGallery
                palette={palette}
                track={track}
                selected={template}
                onSelect={(t) => setTemplate(t)}
              />
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-medium transition-colors"
                >
                  下一步
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">写下祝福</h2>
              <p className="text-white/40 text-center mb-8">可以跳过，也可以写点什么</p>
              <MessageEditor
                message={message}
                senderName={senderName}
                recipientName={recipientName}
                coverTitle={coverTitle}
                onMessageChange={setMessage}
                onSenderChange={setSenderName}
                onRecipientChange={setRecipientName}
                onCoverTitleChange={setCoverTitle}
              />
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 transition-colors"
                >
                  跳过
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-medium transition-colors"
                >
                  下一步
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && track && palette && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-2xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-6">预览你的贺卡</h2>

              {/* Card preview */}
              <div
                id="card-capture"
                className="relative w-full aspect-[9/16] max-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-6"
              >
                <FullTemplate
                  type={template}
                  palette={palette}
                  track={track}
                  message={message}
                  senderName={senderName}
                />
              </div>

              {/* Music player */}
              <div className="mb-6">
                <MusicPlayer trackId={track.id} compact />
              </div>

              {/* Share */}
              <SharePanel
                shareUrl={shareUrl}
                onSaveImage={() => {
                  const el = document.getElementById('card-capture')
                  if (el) saveCardAsImage(el)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
