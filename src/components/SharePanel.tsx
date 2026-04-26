import { useState } from 'react'
import { motion } from 'framer-motion'

interface SharePanelProps {
  shareUrl: string
  onSaveImage: () => void
}

export default function SharePanel({ shareUrl, onSaveImage }: SharePanelProps) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-4"
    >
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
        <p className="text-white/50 text-xs mb-2">分享链接</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-white/80 text-sm outline-none truncate"
          />
          <button
            onClick={copyLink}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
            }`}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onSaveImage}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/80 hover:bg-white/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          保存图片
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: '音乐贺卡', url: shareUrl })
            } else {
              copyLink()
            }
          }}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 hover:bg-indigo-500/30 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          分享
        </button>
      </div>
    </motion.div>
  )
}
