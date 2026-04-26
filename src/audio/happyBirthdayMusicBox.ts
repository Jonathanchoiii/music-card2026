/**
 * 连贯循环的弦乐风格《生日快乐》旋律（Web Audio），长音 + 叠音，无明显断点。
 */

const HZ: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  C5: 523.25,
}

type Step = { k: keyof typeof HZ; dt: number }

/** dt：与上一音的起始间隔（秒），较小值形成叠音、更连贯 */
const MELODY: Step[] = [
  { k: 'C4', dt: 0 },
  { k: 'C4', dt: 0.32 },
  { k: 'D4', dt: 0.32 },
  { k: 'C4', dt: 0.32 },
  { k: 'F4', dt: 0.32 },
  { k: 'E4', dt: 0.36 },
  { k: 'C4', dt: 0.4 },
  { k: 'C4', dt: 0.32 },
  { k: 'D4', dt: 0.32 },
  { k: 'C4', dt: 0.32 },
  { k: 'G4', dt: 0.32 },
  { k: 'F4', dt: 0.36 },
  { k: 'C4', dt: 0.4 },
  { k: 'C4', dt: 0.32 },
  { k: 'C5', dt: 0.32 },
  { k: 'A4', dt: 0.32 },
  { k: 'F4', dt: 0.32 },
  { k: 'E4', dt: 0.32 },
  { k: 'D4', dt: 0.38 },
  { k: 'Bb4', dt: 0.4 },
  { k: 'Bb4', dt: 0.32 },
  { k: 'A4', dt: 0.32 },
  { k: 'F4', dt: 0.32 },
  { k: 'G4', dt: 0.32 },
  { k: 'F4', dt: 0.42 },
]

const NOTE_HOLD = 0.58

function loopLengthSec() {
  let acc = 0
  for (let i = 1; i < MELODY.length; i++) {
    acc += MELODY[i]!.dt
  }
  return acc + NOTE_HOLD + 0.35
}

function playStringNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  when: number,
  dur: number,
  level: number,
) {
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(3200, when)
  filter.frequency.exponentialRampToValueAtTime(900, when + dur * 0.85)
  filter.Q.setValueAtTime(0.6, when)

  const osc1 = ctx.createOscillator()
  osc1.type = 'triangle'
  osc1.frequency.setValueAtTime(freq, when)

  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(freq * 1.003, when)

  const osc3 = ctx.createOscillator()
  osc3.type = 'sine'
  osc3.frequency.setValueAtTime(freq * 0.997, when)

  const mix = ctx.createGain()
  mix.gain.value = 1

  const env = ctx.createGain()
  const peak = level * 0.14
  const atk = 0.06
  const rel = Math.max(0.25, dur * 0.55)
  env.gain.setValueAtTime(0.0001, when)
  env.gain.exponentialRampToValueAtTime(peak, when + atk)
  env.gain.exponentialRampToValueAtTime(peak * 0.88, when + dur - rel)
  env.gain.exponentialRampToValueAtTime(0.0001, when + dur)

  osc1.connect(filter)
  const det = ctx.createGain()
  det.gain.value = 0.45
  osc2.connect(det)
  det.connect(filter)
  const det2 = ctx.createGain()
  det2.gain.value = 0.35
  osc3.connect(det2)
  det2.connect(filter)

  filter.connect(env)
  env.connect(dest)

  const end = when + dur + 0.04
  osc1.start(when)
  osc2.start(when)
  osc3.start(when)
  osc1.stop(end)
  osc2.stop(end)
  osc3.stop(end)
}

function scheduleMelodyPass(ctx: AudioContext, dest: AudioNode, base: number, level: number) {
  let t = base
  for (let i = 0; i < MELODY.length; i++) {
    const step = MELODY[i]!
    if (i > 0) t += step.dt
    playStringNote(ctx, dest, HZ[step.k], t, NOTE_HOLD, level)
  }
}

export type MusicBoxController = {
  start: () => void
  tryResume: () => void
  setMuted: (muted: boolean) => void
  isMuted: () => boolean
  stop: () => void
}

export function createHappyBirthdayMusicBox(): MusicBoxController {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let intervalId = 0
  let muted = false
  let stopped = false

  const loopSec = loopLengthSec()
  const loopMs = Math.ceil(loopSec * 1000)

  const tick = () => {
    if (stopped || !ctx || !master || muted) return
    void ctx.resume()
    scheduleMelodyPass(ctx, master, ctx.currentTime + 0.04, 1)
  }

  const start = () => {
    if (ctx) return
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.32
    master.connect(ctx.destination)

    tick()
    intervalId = window.setInterval(tick, loopMs)
    void ctx.resume()
  }

  const stopFn = () => {
    stopped = true
    window.clearInterval(intervalId)
    intervalId = 0
    void ctx?.close()
    ctx = null
    master = null
  }

  return {
    start,
    tryResume: () => {
      void ctx?.resume()
    },
    setMuted: (m: boolean) => {
      muted = m
      if (master) {
        master.gain.value = m ? 0 : 0.32
      }
    },
    isMuted: () => muted,
    stop: stopFn,
  }
}
