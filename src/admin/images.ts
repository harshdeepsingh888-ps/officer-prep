// Pictures are scaled down and saved as JPEG before they are published: a phone photo of a practice-book page is
// often 4–8 MB, and at 1600 px on the long side it is about 200–400 KB, still sharp on any screen.

const MAX_SIDE = 1600
const QUALITY = 0.85

export async function prepareImage(file: Blob): Promise<{ blob: Blob; w: number; h: number }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode().catch(() => { throw new Error('This file is not a picture the browser can open (try JPEG or PNG).') })
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('This browser can\'t process pictures.')
    ctx.fillStyle = '#ffffff' // JPEG has no transparency: transparent areas become white, like paper
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', QUALITY))
    if (!blob) throw new Error('The picture couldn\'t be converted.')
    return { blob, w, h }
  } finally {
    URL.revokeObjectURL(url)
  }
}
