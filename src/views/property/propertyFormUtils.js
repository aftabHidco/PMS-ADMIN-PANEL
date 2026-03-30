export const resolvePropertyImageUrl = (value, apiBase) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''

  if (/^(data|blob):/i.test(trimmed)) {
    return trimmed
  }

  try {
    const base =
      apiBase || (typeof window !== 'undefined' ? window.location.origin : undefined) || undefined
    return base ? new URL(trimmed, base).toString() : trimmed
  } catch (error) {
    return trimmed
  }
}

export const isValidPropertyImageFile = (file) => {
  if (!(file instanceof File)) return false

  const mimeType = String(file.type || '').trim().toLowerCase()
  if (mimeType.startsWith('image/')) {
    return true
  }

  return /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name || '')
}

export const toBooleanFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      resolve('')
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read property image'))
    reader.readAsDataURL(file)
  })
