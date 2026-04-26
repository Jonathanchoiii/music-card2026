import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0f0a2a] to-[#1a0a2e]" />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-15"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }}
          animate={{
            x: [50, -50, 50],
            y: [30, -30, 30],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 w-[400px] h-[400px] rounded-full blur-[80px] opacity-10"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }}
          animate={{
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center px-6 max-w-2xl"
      >
        {/* Logo / Icon */}
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-8 shadow-xl shadow-indigo-500/20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </motion.div>

        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent mb-4 leading-tight">
          Music Card
        </h1>
        <p className="text-xl text-white/50 mb-2">用音乐传递心意</p>
        <p className="text-base text-white/30 mb-12 max-w-md mx-auto leading-relaxed">
          选一首歌，挑一个视觉模板，写一句祝福语，生成一张独一无二的音乐贺卡，送给你在乎的人。
        </p>

        <motion.button
          onClick={() => navigate('/create')}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white font-semibold text-lg shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          开始制作
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 flex-wrap"
        >
          <motion.button
            type="button"
            onClick={() => navigate('/book')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors cursor-pointer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="px-1.5 py-0.5 text-[9px] tracking-widest uppercase rounded bg-white/10 border border-white/15 text-white/80">
              Three.js
            </span>
            <span className="underline decoration-dotted decoration-white/40 underline-offset-4">3D 翻书与风扇画廊</span>
            <span aria-hidden>→</span>
          </motion.button>
          <motion.button
            type="button"
            onClick={() => navigate('/bloom')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors cursor-pointer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="px-1.5 py-0.5 text-[9px] tracking-widest uppercase rounded bg-gradient-to-r from-fuchsia-500/30 to-indigo-500/30 border border-white/10 text-white/80">
              WebGPU
            </span>
            <span className="underline decoration-dotted decoration-white/40 underline-offset-4">封面光晕渐变</span>
            <span aria-hidden>→</span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Bottom decorative text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-white/20 text-sm"
      >
        Powered by Spotify & Three.js
      </motion.p>
    </div>
  )
}
