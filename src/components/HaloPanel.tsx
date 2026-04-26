import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOLD_PRESET, DEFAULT_HALO_PARAMS, type HaloParams } from '../types/haloParams'

type Field = keyof HaloParams

const FIELDS: Array<{
  key: Field
  label: string
  min: number
  max: number
  step: number
  hint: string
}> = [
  { key: 'orbGain', label: '光晕强度', min: 0.15, max: 1.2, step: 0.01, hint: '整体光斑亮度' },
  { key: 'blobSoft', label: '柔边 / 散景', min: 0.85, max: 2.2, step: 0.02, hint: '越大越柔和、边缘越虚' },
  { key: 'flow', label: '流动感', min: 0.2, max: 1.4, step: 0.02, hint: '漂移与扭曲' },
  { key: 'vigMix', label: '暗角', min: 0, max: 1, step: 0.02, hint: '0 为几乎无压边' },
  { key: 'sheen', label: '中心高光', min: 0, max: 1.2, step: 0.02, hint: '径向镜面感' },
  { key: 'contrast', label: '对比', min: 0.75, max: 1.35, step: 0.01, hint: '后期拉对比' },
  { key: 'grain', label: '颗粒', min: 0, max: 1.2, step: 0.02, hint: '胶片颗粒' },
  { key: 'lift', label: '层次提亮', min: 0, max: 1, step: 0.02, hint: '中灰微调，低更柔' },
]

function clampHalo(p: HaloParams): HaloParams {
  const o = { ...p }
  for (const f of FIELDS) {
    const v = o[f.key]
    o[f.key] = Math.min(f.max, Math.max(f.min, v)) as never
  }
  return o
}

interface HaloPanelProps {
  value: HaloParams
  onChange: (next: HaloParams) => void
}

export function HaloPanel({ value, onChange }: HaloPanelProps) {
  const set = (key: Field, v: number) => {
    onChange(clampHalo({ ...value, [key]: v }))
  }

  return (
    <div className="w-[min(19rem,92vw)] rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl px-3 py-2.5 shadow-2xl shadow-black/50">
      <p className="text-[10px] tracking-widest uppercase text-white/45 mb-2 px-0.5">光晕与画面</p>
      <div className="max-h-[min(60vh,22rem)] space-y-2 overflow-y-auto pr-0.5">
        {FIELDS.map((f) => (
          <label
            key={f.key}
            className="block"
          >
            <div className="flex items-center justify-between text-[10px] text-white/70 mb-0.5">
              <span>{f.label}</span>
              <span className="font-mono text-white/90 tabular-nums">
                {value[f.key].toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              className="w-full h-1.5 appearance-none rounded-full bg-white/10 accent-fuchsia-400 cursor-pointer"
              min={f.min}
              max={f.max}
              step={f.step}
              value={value[f.key]}
              onChange={(e) => set(f.key, Number(e.target.value))}
            />
            <p className="text-[9px] text-white/35 leading-tight mt-0.5 px-0.5">{f.hint}</p>
          </label>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_HALO_PARAMS })}
          className="flex-1 min-w-[5rem] py-1.5 rounded-lg bg-white/8 hover:bg-white/14 text-[11px] text-white/85 cursor-pointer transition-colors"
        >
          柔和默认
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...BOLD_PRESET })}
          className="flex-1 min-w-[5rem] py-1.5 rounded-lg bg-white/8 hover:bg-white/14 text-[11px] text-white/85 cursor-pointer transition-colors"
        >
          更强对比
        </button>
      </div>
    </div>
  )
}

export function HaloPanelToggle({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="pointer-events-auto z-40">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="mb-1.5 w-full py-1.5 rounded-xl border border-white/15 bg-black/40 hover:bg-black/55 text-[11px] text-white/80 tracking-wide transition-colors cursor-pointer"
        aria-expanded={open}
      >
        {open ? '收起调光' : '光晕与画面对比'}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
