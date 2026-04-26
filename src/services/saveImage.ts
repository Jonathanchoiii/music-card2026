import html2canvas from 'html2canvas'

export async function saveCardAsImage(element: HTMLElement, filename = 'music-card.png') {
  try {
    // Try to capture Three.js canvas content as well
    const threeCanvas = element.querySelector('canvas') as HTMLCanvasElement | null
    let bgDataUrl: string | null = null
    if (threeCanvas) {
      try {
        bgDataUrl = threeCanvas.toDataURL('image/png')
      } catch {
        // Canvas may be tainted, fall through to html2canvas
      }
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      onclone: (clonedDoc) => {
        // If we captured the Three.js canvas, overlay it into the cloned element
        if (bgDataUrl) {
          const clonedEl = clonedDoc.getElementById(element.id)
          if (clonedEl) {
            const clonedCanvas = clonedEl.querySelector('canvas')
            if (clonedCanvas) {
              const img = clonedDoc.createElement('img')
              img.src = bgDataUrl
              img.style.cssText = clonedCanvas.style.cssText
              img.style.position = 'absolute'
              img.style.inset = '0'
              img.style.width = '100%'
              img.style.height = '100%'
              img.style.objectFit = 'cover'
              clonedCanvas.parentNode?.replaceChild(img, clonedCanvas)
            }
          }
        }
      },
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Failed to save image:', err)

    // Fallback: try to save just the Three.js canvas
    const threeCanvas = element.querySelector('canvas') as HTMLCanvasElement | null
    if (threeCanvas) {
      try {
        const link = document.createElement('a')
        link.download = filename
        link.href = threeCanvas.toDataURL('image/png')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      } catch {
        // completely failed
      }
    }

    alert('保存图片失败，请尝试截屏保存')
  }
}
