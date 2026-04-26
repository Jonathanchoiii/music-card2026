import { motion } from 'framer-motion'

interface MessageEditorProps {
  message: string
  senderName: string
  recipientName: string
  coverTitle: string
  onMessageChange: (msg: string) => void
  onSenderChange: (name: string) => void
  onRecipientChange: (name: string) => void
  onCoverTitleChange: (title: string) => void
}

export default function MessageEditor({
  message,
  senderName,
  recipientName,
  coverTitle,
  onMessageChange,
  onSenderChange,
  onRecipientChange,
  onCoverTitleChange,
}: MessageEditorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto space-y-6"
    >
      {/* Cover settings */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <p className="text-white/80 text-sm font-medium">封面信息</p>

        <div>
          <label className="block text-white/50 text-xs mb-2">送给（收件人名字，可选）</label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => onRecipientChange(e.target.value)}
            placeholder="例如：小雨"
            maxLength={20}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-all backdrop-blur-sm"
          />
        </div>

        <div>
          <label className="block text-white/50 text-xs mb-2">封面标题（可选）</label>
          <input
            type="text"
            value={coverTitle}
            onChange={(e) => onCoverTitleChange(e.target.value)}
            placeholder="送你一首歌"
            maxLength={20}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-all backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Inside content */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <p className="text-white/80 text-sm font-medium">卡片内容</p>

        <div>
          <label className="block text-white/50 text-xs mb-2">祝福语（可选）</label>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="写下你想说的话..."
            maxLength={200}
            rows={4}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-all resize-none backdrop-blur-sm"
          />
          <p className="text-right text-white/30 text-xs mt-1">{message.length}/200</p>
        </div>

        <div>
          <label className="block text-white/50 text-xs mb-2">署名（可选）</label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => onSenderChange(e.target.value)}
            placeholder="你的名字"
            maxLength={30}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-all backdrop-blur-sm"
          />
        </div>
      </div>
    </motion.div>
  )
}
