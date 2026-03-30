export const createDefaultWebsiteSliderForm = () => ({
  title: '',
  subtitle: '',
  redirect_url: '',
  display_order: 0,
  is_active: true,
  images: [],
  image: null,
  image_url: '',
})

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

const getFileExtension = (filename) => {
  const name = String(filename || '')
  const pieces = name.split('.')
  return pieces.length > 1 ? pieces.pop().trim().toLowerCase() : ''
}

export const isAllowedWebsiteSliderImageFile = (file) => {
  if (!(file instanceof File)) return false

  const mimeType = String(file.type || '').trim().toLowerCase()
  if (ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    return true
  }

  return ALLOWED_IMAGE_EXTENSIONS.has(getFileExtension(file.name))
}

export const getWebsiteSliderImageValidationMessage = (files, { multiple = false } = {}) => {
  const invalidFiles = (Array.isArray(files) ? files : []).filter(
    (file) => !isAllowedWebsiteSliderImageFile(file),
  )

  if (!invalidFiles.length) return ''

  const invalidNames = invalidFiles.map((file) => file?.name || 'unknown file').join(', ')
  return multiple
    ? `Only JPG, PNG, and WEBP files are allowed. Invalid files: ${invalidNames}`
    : `Only JPG, PNG, and WEBP files are allowed. Invalid file: ${invalidNames}`
}

export const toNullableText = (value) => {
  const trimmed = String(value || '').trim()
  return trimmed || null
}

export const toBooleanFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'

export const mapWebsiteSliderToForm = (slider) => ({
  ...createDefaultWebsiteSliderForm(),
  title: slider?.title || '',
  subtitle: slider?.subtitle || '',
  redirect_url: slider?.redirect_url || '',
  display_order: Number(slider?.display_order ?? 0),
  is_active: toBooleanFlag(slider?.is_active),
  image_url: slider?.image_url || '',
})

const appendSharedWebsiteSliderFields = (formData, form) => {
  formData.append('title', toNullableText(form.title) || '')
  formData.append('subtitle', toNullableText(form.subtitle) || '')
  formData.append('redirect_url', toNullableText(form.redirect_url) || '')
  formData.append('display_order', String(Number(form.display_order ?? 0)))
  formData.append('is_active', form.is_active ? 'true' : 'false')
}

export const buildWebsiteSliderBulkFormData = (form) => {
  const formData = new FormData()
  appendSharedWebsiteSliderFields(formData, form)

  const images = Array.isArray(form?.images) ? form.images : []
  images.forEach((image) => {
    if (image instanceof File) {
      formData.append('images', image)
    }
  })

  return formData
}

export const buildWebsiteSliderUpdateFormData = (form) => {
  const formData = new FormData()
  appendSharedWebsiteSliderFields(formData, form)

  if (form?.image instanceof File) {
    formData.append('image', form.image)
  }

  return formData
}

export const normalizeWebsiteSliderCollectionResponse = (payload) => {
  const items = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : []
  const total = Number(payload?.total ?? payload?.data?.total ?? items.length)

  return {
    data: items,
    total: Number.isFinite(total) ? total : items.length,
  }
}

export const unwrapWebsiteSliderResponse = (payload) => {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data
  }

  return payload && typeof payload === 'object' ? payload : null
}

export const hasWebsiteSliderApiError = (payload) => payload?.success === false

export const validateWebsiteSliderDisplayOrder = (value) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return 'Display order is required.'
  }

  const numericValue = Number(normalized)
  if (!Number.isInteger(numericValue) || numericValue < 0) {
    return 'Display order must be a non-negative integer.'
  }

  return ''
}

export const parseJsonSafely = async (response) => {
  try {
    return await response.json()
  } catch (error) {
    return {}
  }
}

export const getApiErrorMessage = (payload, fallback) => {
  if (payload?.success === false) {
    return payload?.message || payload?.error || fallback
  }

  return payload?.error || payload?.message || fallback
}

export const formatWebsiteSliderDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('en-IN', { hour12: true })
}

export const resolveWebsiteSliderImageUrl = (value, apiBase) => {
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
