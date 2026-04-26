import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { createAppleHappyBirthdayPreviewPlayer } from '../audio/appleBirthdayPreview'
import './Book3DGallery.css'

const PAGE_WIDTH = 3.6
const PAGE_HEIGHT = 4.8

/**
 * 贺卡图片：Vite eager 进包（路径须为 ASCII，避免 Vercel/Linux 上中文目录 + import.meta.glob 偶发匹配不到）。
 * - `src/assets/book-images/`：主目录（已纳入 Git）
 * - 仓库根 `book-assets/`：可选覆盖（同名文件优先生效）
 *
 * 文件名约定：cover.png、j10.png、vibe cover.png / vibecover.png、cover2.png、j*.png（不含 j9）
 */
const bookAssetModules = {
  ...import.meta.glob('../assets/book-images/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' }),
  ...import.meta.glob('../../book-assets/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' }),
} as Record<string, string>

/** 打包后的 /assets/... 在部分路由下需用绝对 URL，否则 TextureLoader 可能请求错路径 */
function toAbsoluteAssetUrl(src: string): string {
  if (/^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src
  try {
    return new URL(src, window.location.origin).href
  } catch {
    return src
  }
}

function isVibeCoverAssetName(name: string) {
  return name === 'vibecover.png' || name === 'vibe cover.png'
}

type BookTextureSlot = {
  kind: 'cover' | 'insideCover' | 'inner' | 'vibeInside' | 'backOutside'
  url: string
}

function resolveBookAssetUrls(): {
  coverUrl: string | null
  insideCoverUrl: string | null
  vibeInsideUrl: string | null
  backOutsideUrl: string | null
  innerUrls: string[]
} {
  /** 同名文件：`book-assets/` 覆盖 `0426 金柱勋测试/`（合并对象中后者键在后，Map 保留最后一次写入） */
  const byFileName = new Map<string, { url: string; name: string }>()
  for (const [path, url] of Object.entries(bookAssetModules)) {
    const name = (path.split('/').pop() ?? '').toLowerCase()
    byFileName.set(name, { url, name })
  }
  const entries = [...byFileName.values()]
  const coverEntry = entries.find((e) => e.name === 'cover.png')
  const insideCoverEntry = entries.find((e) => e.name === 'j10.png')
  const vibeEntry = entries.find((e) => isVibeCoverAssetName(e.name))
  const backOutsideEntry = entries.find((e) => e.name === 'cover2.png')
  const inner = entries
    .filter(
      (e) =>
        e.name !== 'cover.png' &&
        e.name !== 'j10.png' &&
        e.name !== 'j9.png' &&
        e.name !== 'cover2.png' &&
        !isVibeCoverAssetName(e.name),
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
  return {
    coverUrl: coverEntry?.url ?? null,
    insideCoverUrl: insideCoverEntry?.url ?? null,
    vibeInsideUrl: vibeEntry?.url ?? null,
    backOutsideUrl: backOutsideEntry?.url ?? null,
    innerUrls: inner.map((e) => e.url),
  }
}

function planBookTextureSlots(assets: ReturnType<typeof resolveBookAssetUrls>): BookTextureSlot[] {
  const slots: BookTextureSlot[] = []
  if (assets.coverUrl) slots.push({ kind: 'cover', url: assets.coverUrl })
  if (assets.insideCoverUrl) slots.push({ kind: 'insideCover', url: assets.insideCoverUrl })
  for (const url of assets.innerUrls) slots.push({ kind: 'inner', url })
  if (assets.vibeInsideUrl) slots.push({ kind: 'vibeInside', url: assets.vibeInsideUrl })
  if (assets.backOutsideUrl) slots.push({ kind: 'backOutside', url: assets.backOutsideUrl })
  return slots
}

function bookViewCameraZ(sheetCount: number) {
  return Math.min(26, 13.5 + sheetCount * 0.55)
}

function fanViewCameraZ(sheetCount: number) {
  return Math.min(52, 21 + sheetCount * 1.25)
}

const FLIP_DURATION = 0.85
const FLIP_EASE = 'power2.inOut'

const SVG_VOLUME_ON = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`

const SVG_VOLUME_OFF = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`

function createCoverTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1365
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#7ca0bd'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#2a3b4c'
  ctx.lineWidth = 10
  ctx.translate(canvas.width / 2, canvas.height / 2)
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.ellipse(0, -120, 45, 100, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.rotate(Math.PI / 3)
  }
  ctx.beginPath()
  ctx.arc(0, 0, 50, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = 'rgba(0,0,0,0.05)'
  ctx.fillRect(0, 0, 40, canvas.height)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function Book3DGallery() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasHostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const canvasHost = canvasHostRef.current
    if (!root || !canvasHost) return

    let scene: THREE.Scene | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let renderer: THREE.WebGLRenderer | null = null
    let bookGroup: THREE.Group | null = null
    let sheets: THREE.Group[] = []
    let currentSheetIndex = 0
    let totalSheets = 0
    let isFanMode = false
    let raf = 0
    let disposed = false

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()

    const getSize = () => {
      const rect = canvasHost.getBoundingClientRect()
      return { w: Math.max(1, rect.width), h: Math.max(1, rect.height) }
    }

    const setPointerFromEvent = (e: PointerEvent) => {
      const rect = canvasHost.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      ndc.set(x, y)
    }

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)

    const { w: iw, h: ih } = getSize()
    camera = new THREE.PerspectiveCamera(35, iw / ih, 0.1, 1000)
    camera.position.set(0, 0, 16)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(iw, ih)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    canvasHost.appendChild(renderer.domElement)

    bookGroup = new THREE.Group()
    bookGroup.position.x = 0
    scene.add(bookGroup)

    const loaderEl = root.querySelector('#loader') as HTMLElement | null
    const modeBookBtn = root.querySelector('#mode-book') as HTMLButtonElement | null
    const modeGalleryBtn = root.querySelector('#mode-gallery') as HTMLButtonElement | null
    const replayBtn = root.querySelector('#replay-btn') as HTMLButtonElement | null
    const musicToggle = root.querySelector('#music-toggle') as HTMLButtonElement | null

    const music = createAppleHappyBirthdayPreviewPlayer()
    music.start()

    const unlockAudio = () => {
      music.tryResume()
    }
    root.addEventListener('pointerdown', unlockAudio, { passive: true })
    document.addEventListener('touchend', unlockAudio, { passive: true, capture: true })

    const syncMusicIcon = () => {
      if (!musicToggle) return
      musicToggle.innerHTML = music.isMuted() ? SVG_VOLUME_OFF : SVG_VOLUME_ON
      musicToggle.setAttribute(
        'aria-label',
        music.isMuted()
          ? '开启背景音乐（Apple Music 试听约30秒循环）'
          : '关闭背景音乐',
      )
      musicToggle.setAttribute('aria-pressed', music.isMuted() ? 'true' : 'false')
    }
    const onMusicToggleClick = (e: MouseEvent) => {
      e.stopPropagation()
      music.setMuted(!music.isMuted())
      syncMusicIcon()
    }
    musicToggle?.addEventListener('click', onMusicToggleClick)
    syncMusicIcon()

    let pointerDown = false
    let dragKind: 'none' | 'orbit' | 'swipe' = 'none'
    let startX = 0
    let startY = 0
    let lastX = 0
    let lastY = 0
    let fanDragVelocity = 0

    const SWIPE_PX = 48
    /** 画廊：水平拖 = 绕竖轴（与自动旋转同轴叠加） */
    const FAN_YAW_SCALE = 0.006
    /** 画廊：垂直拖 = 俯仰查看 */
    const FAN_PITCH_SCALE = 0.0048
    const FAN_PITCH_MIN = 0.1
    const FAN_PITCH_MAX = 1.55
    /** 画廊空闲时绕 Y 恒速旋转；拖拽时不暂停 */
    const FAN_AUTO_YAW = 0.002

    const killSheetTweens = (sheet: THREE.Group) => {
      gsap.killTweensOf(sheet.rotation)
      gsap.killTweensOf(sheet.position)
    }

    type PageFlipOpts = {
      endY: number
      endZ: number
      duration?: number
      delay?: number
      ease?: string
      onComplete?: () => void
    }

    /** 基础翻页：仅绕书脊 Y 旋转 + Z 叠层 */
    const runPageFlip = (sheet: THREE.Group, opts: PageFlipOpts) => {
      const duration = opts.duration ?? FLIP_DURATION
      const ease = opts.ease ?? FLIP_EASE
      const delay = opts.delay ?? 0
      const { endY, endZ } = opts

      killSheetTweens(sheet)
      gsap
        .timeline({ onComplete: opts.onComplete })
        .to(sheet.rotation, { x: 0, y: endY, z: 0, duration, delay, ease }, 0)
        .to(sheet.position, { z: endZ, duration, delay, ease }, 0)
    }

    const checkReplayButton = () => {
      if (!replayBtn) return
      if (currentSheetIndex === totalSheets && !isFanMode) {
        replayBtn.classList.add('visible')
      } else {
        replayBtn.classList.remove('visible')
      }
    }

    const turnPage = (sheetIndex: number, direction: 'left' | 'right') => {
      const sheet = sheets[sheetIndex]
      if (!sheet || !bookGroup) return
      const endY = direction === 'left' ? -Math.PI : 0
      const endZ = direction === 'left' ? sheetIndex * 0.005 : -sheetIndex * 0.005
      runPageFlip(sheet, {
        endY,
        endZ,
        onComplete: () => checkReplayButton(),
      })
      window.setTimeout(checkReplayButton, Math.round(FLIP_DURATION * 1000))
    }

    const tryBookTapFlip = (e: PointerEvent) => {
      if (isFanMode || sheets.length === 0 || !bookGroup || !camera) return
      setPointerFromEvent(e)
      raycaster.setFromCamera(ndc, camera)
      const intersects = raycaster.intersectObjects(bookGroup.children, true)
      if (intersects.length === 0) return
      // 封面未翻开时：点到封面上任意位置都应能翻开（原版仅右半屏有效，易被误认为「坏了」）
      const openCover = currentSheetIndex === 0
      if (openCover || ndc.x > 0) {
        if (currentSheetIndex < totalSheets) {
          turnPage(currentSheetIndex, 'left')
          currentSheetIndex++
        }
      } else if (currentSheetIndex > 0) {
        currentSheetIndex--
        turnPage(currentSheetIndex, 'right')
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      renderer?.domElement.setPointerCapture(e.pointerId)
      pointerDown = true
      dragKind = 'none'
      startX = lastX = e.clientX
      startY = lastY = e.clientY
      fanDragVelocity = 0
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!pointerDown) {
        if (isFanMode) {
          document.body.style.cursor = 'default'
          return
        }
        setPointerFromEvent(e as PointerEvent)
        if (!camera || !bookGroup) return
        raycaster.setFromCamera(ndc, camera)
        const intersects = raycaster.intersectObjects(bookGroup.children, true)
        document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
        return
      }

      const dx = e.clientX - startX
      const dy = e.clientY - startY

      if (dragKind === 'none' && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        if (isFanMode) {
          dragKind = 'orbit'
          lastX = e.clientX
          lastY = e.clientY
        } else if (Math.abs(dx) >= Math.abs(dy)) {
          dragKind = 'swipe'
        } else {
          dragKind = 'swipe'
        }
      }

      if (dragKind === 'orbit' && isFanMode && bookGroup) {
        const rdx = e.clientX - lastX
        const rdy = e.clientY - lastY
        lastX = e.clientX
        lastY = e.clientY
        bookGroup.rotation.y += rdx * FAN_YAW_SCALE
        bookGroup.rotation.x -= rdy * FAN_PITCH_SCALE
        bookGroup.rotation.x = Math.max(FAN_PITCH_MIN, Math.min(FAN_PITCH_MAX, bookGroup.rotation.x))
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!pointerDown) return
      pointerDown = false
      try {
        renderer?.domElement.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }

      const dx = e.clientX - startX
      const dy = e.clientY - startY

      // 只有「明显的水平滑动」才走滑动手势；轻微抖动会标成 swipe 但位移不够，仍应走点击射线检测
      const didHorizontalSwipe =
        dragKind === 'swipe' && Math.abs(dx) >= SWIPE_PX && Math.abs(dx) >= Math.abs(dy)

      if (!isFanMode && didHorizontalSwipe) {
        if (dx < 0) {
          if (currentSheetIndex < totalSheets) {
            turnPage(currentSheetIndex, 'left')
            currentSheetIndex++
          }
        } else if (currentSheetIndex > 0) {
          currentSheetIndex--
          turnPage(currentSheetIndex, 'right')
        }
      } else if (!isFanMode) {
        tryBookTapFlip(e)
      }

      dragKind = 'none'
    }

    const onPointerCancel = () => {
      pointerDown = false
      dragKind = 'none'
    }

    const replayBook = () => {
      if (isFanMode || !replayBtn || !bookGroup) return
      replayBtn.classList.remove('visible')
      currentSheetIndex = 0
      gsap.to(bookGroup.position, { x: 0, duration: 1.5, ease: 'power3.inOut' })
      sheets.forEach((sheet, i) => {
        const endZ = -i * 0.005
        if (Math.abs(sheet.rotation.y) < 0.003 && Math.abs(sheet.position.z - endZ) < 0.0002) {
          sheet.rotation.set(0, 0, 0, 'YXZ')
          sheet.position.z = endZ
          return
        }
        runPageFlip(sheet, {
          endY: 0,
          endZ,
          delay: (totalSheets - i) * 0.06,
        })
      })
      window.setTimeout(
        checkReplayButton,
        Math.ceil(FLIP_DURATION * 1000 + Math.max(0, totalSheets - 1) * 60 + 80),
      )
    }

    const syncModeChips = () => {
      modeBookBtn?.classList.toggle('is-selected', !isFanMode)
      modeBookBtn?.setAttribute('aria-selected', !isFanMode ? 'true' : 'false')
      modeGalleryBtn?.classList.toggle('is-selected', isFanMode)
      modeGalleryBtn?.setAttribute('aria-selected', isFanMode ? 'true' : 'false')
    }

    const setFanMode = (nextFan: boolean) => {
      if (!bookGroup || !camera) return
      if (nextFan === isFanMode) {
        syncModeChips()
        return
      }
      isFanMode = nextFan
      replayBtn?.classList.remove('visible')
      gsap.killTweensOf(bookGroup.rotation)
      gsap.killTweensOf(bookGroup.position)
      gsap.killTweensOf(camera.position)
      sheets.forEach((s) => killSheetTweens(s))

      const innerCount = Math.max(1, totalSheets - 2)

      if (isFanMode) {
        const fz = fanViewCameraZ(innerCount)
        gsap.to(camera.position, { x: 0, y: 0, z: fz, duration: 2, ease: 'power3.inOut' })
        gsap.to(bookGroup.position, { x: 0, y: 0, z: 0, duration: 2, ease: 'power3.inOut' })
        gsap.to(bookGroup.rotation, { x: 0.8, z: -0.2, duration: 2, ease: 'power3.inOut' })
        sheets.forEach((sheet, i) => {
          if (i === 0 || i === totalSheets - 1) {
            sheet.visible = false
            return
          }
          const j = i - 1
          const angle = -(j / innerCount) * Math.PI * 2
          gsap.to(sheet.rotation, { x: 0, y: angle, duration: 2, ease: 'power3.inOut' })
          gsap.to(sheet.position, { z: 0, duration: 2, ease: 'power3.inOut' })
        })
      } else {
        const bz = bookViewCameraZ(totalSheets)
        gsap.to(camera.position, { x: 0, y: 0, z: bz, duration: 2, ease: 'power3.inOut' })
        bookGroup.rotation.y = bookGroup.rotation.y % (Math.PI * 2)
        gsap.to(bookGroup.rotation, { x: 0, y: 0, z: 0, duration: 2, ease: 'power3.inOut' })
        gsap.to(bookGroup.position, { x: 0, y: 0, z: 0, duration: 2, ease: 'power3.inOut' })
        sheets.forEach((sheet, i) => {
          sheet.visible = true
          const isTurnedLeft = i < currentSheetIndex
          const targetRotY = isTurnedLeft ? -Math.PI : 0
          const targetZ = isTurnedLeft ? i * 0.005 : -i * 0.005
          gsap.to(sheet.rotation, { x: 0, y: targetRotY, duration: 2, ease: 'power3.inOut' })
          gsap.to(sheet.position, { z: targetZ, duration: 2, ease: 'power3.inOut' })
        })
        window.setTimeout(checkReplayButton, 2000)
      }
      syncModeChips()
    }

    const onModeBookClick = (e: MouseEvent) => {
      e.stopPropagation()
      setFanMode(false)
    }
    const onModeGalleryClick = (e: MouseEvent) => {
      e.stopPropagation()
      setFanMode(true)
    }

    const onResize = () => {
      if (!camera || !renderer) return
      const { w, h } = getSize()
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    const ro = new ResizeObserver(() => {
      if (!disposed) onResize()
    })
    ro.observe(canvasHost)

    const animate = () => {
      raf = requestAnimationFrame(animate)
      if (!renderer || !scene || !camera || !bookGroup) return
      if (isFanMode) {
        bookGroup.rotation.y += FAN_AUTO_YAW
        const inOrbitDrag = pointerDown && dragKind === 'orbit'
        if (!inOrbitDrag) {
          bookGroup.rotation.y += fanDragVelocity
          fanDragVelocity *= 0.92
          if (Math.abs(fanDragVelocity) < 0.0002) fanDragVelocity = 0
        }
      }
      renderer.render(scene, camera)
    }

    const hideLoader = () => {
      if (!loaderEl) return
      loaderEl.style.opacity = '0'
      window.setTimeout(() => {
        if (loaderEl) loaderEl.style.display = 'none'
      }, 800)
    }

    /**
     * 封面 cover；封面背 j10；内页 j* 两两一组；
     * 最后一跨页内侧：vibecover（若无则 #EEEEEE）；封底外侧：cover2（若无则程序纹理）
     */
    const buildBook = (
      frontCoverTex: THREE.Texture,
      innerTextures: THREE.Texture[],
      insideCoverTex: THREE.Texture | null,
      vibeInsideTex: THREE.Texture | null,
      backOutsideTex: THREE.Texture | null,
    ) => {
      if (!bookGroup) return
      const backBoardFallback = backOutsideTex ?? createCoverTexture()
      const blank = () => new THREE.MeshBasicMaterial({ color: 0xeeeeee })
      const internalSheets = Math.ceil(innerTextures.length / 2)
      totalSheets = internalSheets + 2
      sheets = []

      for (let i = 0; i < totalSheets; i++) {
        const sheetGroup = new THREE.Group()
        let frontMat: THREE.MeshBasicMaterial
        let backMat: THREE.MeshBasicMaterial

        if (i === 0) {
          frontMat = new THREE.MeshBasicMaterial({ map: frontCoverTex, color: 0xffffff })
          backMat = insideCoverTex
            ? new THREE.MeshBasicMaterial({ map: insideCoverTex, color: 0xffffff })
            : blank()
        } else if (i === totalSheets - 1) {
          frontMat = vibeInsideTex
            ? new THREE.MeshBasicMaterial({ map: vibeInsideTex, color: 0xffffff })
            : blank()
          backMat = new THREE.MeshBasicMaterial({ map: backBoardFallback, color: 0xffffff })
        } else {
          const imgIndex = (i - 1) * 2
          const tFront = innerTextures[imgIndex]
          const tBack = innerTextures[imgIndex + 1]
          frontMat = new THREE.MeshBasicMaterial({
            map: tFront ?? null,
            color: tFront ? 0xffffff : 0xcccccc,
          })
          backMat = new THREE.MeshBasicMaterial({
            map: tBack ?? null,
            color: tBack ? 0xffffff : 0xcccccc,
          })
        }

        const frontGeo = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT)
        frontGeo.translate(PAGE_WIDTH / 2, 0, 0)
        const frontMesh = new THREE.Mesh(frontGeo, frontMat)
        frontMesh.position.z = 0.001

        const backGeo = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT)
        backGeo.translate(-PAGE_WIDTH / 2, 0, 0)
        const backMesh = new THREE.Mesh(backGeo, backMat)
        backMesh.rotation.y = Math.PI
        backMesh.position.z = -0.001

        sheetGroup.add(frontMesh)
        sheetGroup.add(backMesh)
        sheetGroup.position.z = -i * 0.005
        sheetGroup.rotation.order = 'YXZ'
        sheetGroup.userData = { index: i }
        sheets.push(sheetGroup)
        bookGroup.add(sheetGroup)
      }

      if (camera) {
        camera.position.z = bookViewCameraZ(totalSheets)
      }
    }

    const textureLoader = new THREE.TextureLoader()
    /**
     * three@0.184 默认 `crossOrigin = 'anonymous'`，同源 PNG 也会走 CORS 模式；部分浏览器 / WebView
     * 下 WebGL 上传会失败（画面只剩程序生成的封面）。不设置 crossOrigin 时同源 <img> 可正常作为纹理。
     */
    textureLoader.setCrossOrigin(undefined as unknown as string)

    const bookAssets = resolveBookAssetUrls()
    const textureSlots = planBookTextureSlots(bookAssets)
    const textureBucket: (THREE.Texture | undefined)[] = new Array(textureSlots.length)

    const applyLoadedTextures = () => {
      if (disposed) return
      hideLoader()
      let frontCover: THREE.Texture = createCoverTexture()
      let insideCover: THREE.Texture | null = null
      let vibeInside: THREE.Texture | null = null
      let backOutside: THREE.Texture | null = null
      const inner: THREE.Texture[] = []
      textureSlots.forEach((slot, i) => {
        const tex = textureBucket[i]
        if (!tex) return
        if (slot.kind === 'cover') frontCover = tex
        else if (slot.kind === 'insideCover') insideCover = tex
        else if (slot.kind === 'vibeInside') vibeInside = tex
        else if (slot.kind === 'backOutside') backOutside = tex
        else inner.push(tex)
      })
      buildBook(frontCover, inner, insideCover, vibeInside, backOutside)
    }

    const loadTextureViaFetchBitmap = async (abs: string) => {
      const res = await fetch(abs, { mode: 'cors', credentials: 'omit' })
      if (!res.ok) throw new Error(`fetch ${res.status}: ${abs}`)
      const blob = await res.blob()
      const bitmap = await createImageBitmap(blob)
      const tex = new THREE.Texture(bitmap)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.flipY = false
      tex.needsUpdate = true
      return tex
    }

    const loadOneTexture = (url: string) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        const abs = toAbsoluteAssetUrl(url)
        textureLoader.load(
          abs,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace
            resolve(tex)
          },
          undefined,
          () => {
            void loadTextureViaFetchBitmap(abs).then(resolve).catch(() => reject(new Error(`texture: ${abs}`)))
          },
        )
      })

    void (async () => {
      if (textureSlots.length === 0) {
        applyLoadedTextures()
        return
      }
      const settled = await Promise.allSettled(textureSlots.map((s) => loadOneTexture(s.url)))
      settled.forEach((res, i) => {
        if (res.status === 'fulfilled') textureBucket[i] = res.value
      })
      if (!disposed) applyLoadedTextures()
    })()

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerCancel)
    modeBookBtn?.addEventListener('click', onModeBookClick)
    modeGalleryBtn?.addEventListener('click', onModeGalleryClick)
    syncModeChips()
    replayBtn?.addEventListener('click', replayBook)

    animate()

    return () => {
      disposed = true
      root.removeEventListener('pointerdown', unlockAudio)
      document.removeEventListener('touchend', unlockAudio, true)
      musicToggle?.removeEventListener('click', onMusicToggleClick)
      music.stop()
      cancelAnimationFrame(raf)
      ro.disconnect()
      if (renderer) {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown)
        renderer.domElement.removeEventListener('pointermove', onPointerMove)
        renderer.domElement.removeEventListener('pointerup', onPointerUp)
        renderer.domElement.removeEventListener('pointercancel', onPointerCancel)
      }
      modeBookBtn?.removeEventListener('click', onModeBookClick)
      modeGalleryBtn?.removeEventListener('click', onModeGalleryClick)
      replayBtn?.removeEventListener('click', replayBook)
      if (camera) gsap.killTweensOf(camera.position)
      if (bookGroup) {
        gsap.killTweensOf(bookGroup.position)
        gsap.killTweensOf(bookGroup.rotation)
      }
      sheets.forEach((s) => killSheetTweens(s))
      if (scene) {
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose()
            const mats = obj.material
            if (Array.isArray(mats)) mats.forEach((m) => m.dispose())
            else obj.material?.dispose()
          }
        })
      }
      renderer?.dispose()
      if (renderer?.domElement.parentElement === canvasHost) {
        canvasHost.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div ref={rootRef} className="book3d-root">
      <div id="loader" className="book3d-loader">
        LOADING ASSETS...
      </div>

      <div className="book3d-top-nav">
        <span>( 金主训 )</span>
        <span>( 生日 )</span>
        <span>( 快乐 )</span>
      </div>

      <footer className="book3d-footer" aria-label="页面控制">
        <div className="book3d-footer-row1">
          <div className="book3d-footer-left">
            <div className="book3d-mode-row" role="tablist" aria-label="展示模式">
              <button type="button" className="book3d-mode-chip is-selected" id="mode-book" role="tab" aria-selected="true">
                贺卡
              </button>
              <button type="button" className="book3d-mode-chip" id="mode-gallery" role="tab" aria-selected="false">
                画廊
              </button>
            </div>
          </div>
          <div className="book3d-footer-right">
            <button type="button" className="book3d-music-btn" id="music-toggle" aria-label="背景音乐" aria-pressed="false" />
          </div>
        </div>
        <div className="book3d-footer-row2">
          <span className="book3d-credit">CREATED BY JONATHAN</span>
          <span className="book3d-year">©2026</span>
        </div>
      </footer>

      <button type="button" id="replay-btn" className="book3d-replay-btn">
        再看一遍 ↺
      </button>

      <div ref={canvasHostRef} id="canvas-container" className="book3d-canvas-host" />
    </div>
  )
}
