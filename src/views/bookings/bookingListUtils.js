export const INITIAL_FILTERS = {
  search: '',
  property_id: '',
  booking_status: '',
  checkin_from: '',
  checkin_to: '',
}

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'pan', label: 'PAN' },
  { value: 'driving_license', label: 'Driving License' },
]

export const CUSTOM_POLICY_VALUE = '__custom__'

export const createUploadPerson = (overrides = {}) => ({
  person_name: '',
  relation: '',
  document_type: 'id_proof',
  note: '',
  files: [],
  ...overrides,
})

export const revokePersonFilePreviews = (people = []) => {
  people.forEach((person) => {
    ;(person?.files || []).forEach((fileItem) => {
      if (fileItem?.preview) {
        URL.revokeObjectURL(fileItem.preview)
      }
    })
  })
}

export const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.bookings)) return payload.bookings
  return []
}

export const extractObject = (payload) => {
  if (!payload) return null
  if (Array.isArray(payload)) return payload[0] || null
  if (payload?.data && !Array.isArray(payload.data) && typeof payload.data === 'object') {
    return payload.data
  }
  if (payload?.booking && typeof payload.booking === 'object') return payload.booking
  return payload
}

export const normalizeFileUrls = (source) => {
  const raw = []
  if (Array.isArray(source?.files)) raw.push(...source.files)
  if (Array.isArray(source?.images)) raw.push(...source.images)
  if (Array.isArray(source?.image_urls)) raw.push(...source.image_urls)
  if (Array.isArray(source?.document_urls)) raw.push(...source.document_urls)
  if (Array.isArray(source?.attachments)) raw.push(...source.attachments)
  if (source?.file_url) raw.push(source.file_url)
  if (source?.image_url) raw.push(source.image_url)
  if (source?.url) raw.push(source.url)

  return raw
    .map((item) => {
      if (typeof item === 'string') return item
      if (!item || typeof item !== 'object') return ''
      return item.url || item.file_url || item.image_url || item.path || ''
    })
    .filter(Boolean)
}

export const normalizeUploadedDocuments = (payload) => {
  const list = extractArray(payload)
  const normalized = []

  list.forEach((item, index) => {
    const basePersonName =
      item?.person_name ||
      item?.guest_name ||
      item?.name ||
      item?.person?.name ||
      `Person ${index + 1}`

    if (Array.isArray(item?.documents) && item.documents.length > 0) {
      item.documents.forEach((doc, docIdx) => {
        normalized.push({
          document_id: doc?.document_id || doc?.id || `${index}-${docIdx}`,
          person_name: doc?.person_name || basePersonName,
          relation: doc?.relation || item?.relation || '',
          document_type: doc?.document_type || doc?.type || item?.document_type || 'other',
          note: doc?.note || doc?.remark || doc?.description || item?.note || '',
          file_urls: normalizeFileUrls(doc),
          uploaded_at: doc?.created_at || doc?.uploaded_at || item?.created_at || '',
        })
      })
      return
    }

    normalized.push({
      document_id: item?.document_id || item?.id || `${index}`,
      person_name: basePersonName,
      relation: item?.relation || '',
      document_type: item?.document_type || item?.type || 'other',
      note: item?.note || item?.remark || item?.description || '',
      file_urls: normalizeFileUrls(item),
      uploaded_at: item?.created_at || item?.uploaded_at || '',
    })
  })

  return normalized
}

export const normalizeStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

export const formatStatusLabel = (value) => {
  const text = String(value || '')
    .replace(/_/g, ' ')
    .trim()
  if (!text) return '-'
  return text
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const parseDateValue = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const text = String(value).trim()
  if (!text) return null

  const dmyMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmyMatch) {
    const day = Number(dmyMatch[1])
    const month = Number(dmyMatch[2])
    const year = Number(dmyMatch[3])
    const date = new Date(year, month - 1, day)
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date
    }
    return null
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    const date = new Date(year, month - 1, day)
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date
    }
    return null
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export const toDateOnly = (value) => {
  const date = parseDateValue(value)
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export const normalizeDateFilterValue = (value) => {
  const date = parseDateValue(value)
  if (!date) return value
  return date.toLocaleDateString('en-GB')
}

export const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB')
}

export const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export const calculateCancellationAmounts = (bookingAmount, deductionPercentage) => {
  const safeBookingAmount = Math.max(0, toNumber(bookingAmount, 0))
  const safeDeductionPercentage = Math.max(0, toNumber(deductionPercentage, 0))
  const deductionAmount = (safeBookingAmount * safeDeductionPercentage) / 100
  const refundAmount = Math.max(0, safeBookingAmount - deductionAmount)

  return {
    booking_amount: safeBookingAmount,
    deduction_percentage: safeDeductionPercentage,
    deduction_amount: deductionAmount,
    refund_amount: refundAmount,
  }
}

export const formatCurrency = (value) => {
  const amount = toNumber(value, 0)
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const inDateRange = (value, from, to) => {
  if (!from && !to) return true
  const current = toDateOnly(value)
  if (!current) return false

  const start = toDateOnly(from)
  const end = toDateOnly(to)
  if (start && current < start) return false
  if (end && current > end) return false
  return true
}

export const getBookingId = (booking) => booking?.booking_id || booking?.id || booking?.bookingId

export const getBookingCancellationPolicyId = (booking) =>
  booking?.cancellation_policy_id || booking?.cancellation_policy?.id || ''

export const getBookingCode = (booking) =>
  booking?.booking_code ||
  booking?.booking_no ||
  booking?.booking_number ||
  booking?.reference_no ||
  booking?.reference ||
  '-'

export const getGuestName = (booking) =>
  booking?.user?.full_name ||
  booking?.guest?.full_name ||
  booking?.guest_name ||
  booking?.customer_name ||
  booking?.full_name ||
  '-'

export const getGuestPhone = (booking) =>
  booking?.user?.phone || booking?.guest?.phone || booking?.phone || booking?.mobile || '-'

export const getPropertyId = (booking) =>
  booking?.property_id || booking?.property?.property_id || booking?.property?.id || ''

export const getPropertyName = (booking, propertyMap) =>
  booking?.property?.property_name ||
  booking?.property_name ||
  propertyMap[getPropertyId(booking)] ||
  '-'

export const getBookingStatus = (booking) => normalizeStatus(booking?.booking_status || booking?.status)

export const getPaymentStatus = (booking) =>
  normalizeStatus(booking?.payment_status || booking?.payment?.status || booking?.paymentStatus)

export const getCheckinDate = (booking) =>
  booking?.checkin_date || booking?.check_in || booking?.start_date || booking?.from_date || ''

export const getCheckoutDate = (booking) =>
  booking?.checkout_date || booking?.check_out || booking?.end_date || booking?.to_date || ''

export const getCreatedAt = (booking) =>
  booking?.created_at || booking?.createdAt || booking?.booking_date || booking?.date || ''

export const getUpdatedAt = (booking) =>
  booking?.audit?.updated_at || booking?.updated_at || booking?.updatedAt || ''

export const getCreatedAuditAt = (booking) => booking?.audit?.created_at || getCreatedAt(booking)

export const getStayNights = (booking) => {
  const checkin = toDateOnly(getCheckinDate(booking))
  const checkout = toDateOnly(getCheckoutDate(booking))
  if (!checkin || !checkout) return null

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.max(0, Math.round((checkout.getTime() - checkin.getTime()) / msPerDay))
}

export const getStayNightsValue = (booking) => {
  const apiStayNights = Number(booking?.stay_nights)
  if (Number.isFinite(apiStayNights) && apiStayNights >= 0) return apiStayNights
  return getStayNights(booking) ?? 0
}

export const getPaymentTotalAmount = (booking) =>
  toNumber(booking?.payment_summary?.total_amount || booking?.total_amount || getGrandTotal(booking), 0)

export const getTaxAmount = (booking) =>
  toNumber(
    booking?.payment_summary?.total_tax_amount ??
      booking?.pricing_summary?.tax_amount ??
      booking?.tax_amount ??
      booking?.total_tax_amount,
    0,
  )

export const getPaymentTotalPaid = (booking) => {
  if (booking?.payment_summary?.total_paid !== undefined) {
    return toNumber(booking.payment_summary.total_paid, 0)
  }

  if (Array.isArray(booking?.payments) && booking.payments.length > 0) {
    return booking.payments.reduce((sum, payment) => sum + toNumber(payment?.amount, 0), 0)
  }

  return 0
}

export const getPaymentOutstanding = (booking) => {
  if (booking?.payment_summary?.outstanding_amount !== undefined) {
    return toNumber(booking.payment_summary.outstanding_amount, 0)
  }
  return Math.max(0, getPaymentTotalAmount(booking) - getPaymentTotalPaid(booking))
}

export const getBookingSource = (booking) => booking?.source || booking?.booking_source || '-'

export const getBookingNotes = (booking) => booking?.notes || booking?.note || '-'

export const getRoomSummaryRows = (booking) => {
  if (Array.isArray(booking?.items) && booking.items.length > 0) {
    return booking.items.map((item, idx) => ({
      key: `item-${item.item_id || idx}`,
      roomType: item?.room_type?.room_type_name || item?.room_type_name || item?.room_type_id || '-',
      qty: toNumber(item?.quantity || item?.qty, 0),
      unitPrice: toNumber(item?.unit_price || item?.price_per_night, 0),
      amount: toNumber(item?.amount || item?.subtotal, 0),
    }))
  }

  if (Array.isArray(booking?.pricing_summary?.breakup) && booking.pricing_summary.breakup.length > 0) {
    return booking.pricing_summary.breakup.map((item, idx) => ({
      key: `breakup-${item.room_type_id || idx}-${idx}`,
      roomType: item?.room_type_name || item?.room_type_id || '-',
      qty: toNumber(item?.qty, 0),
      unitPrice: toNumber(item?.price_per_night, 0),
      amount: toNumber(item?.subtotal, 0),
    }))
  }

  return []
}

export const getGuestCount = (booking) =>
  toNumber(booking?.num_guests || booking?.guests || booking?.guest_count, 0)

export const getPersonLabel = (booking) => {
  const guestCount = getGuestCount(booking)
  const guestName = getGuestName(booking)
  const baseName = guestName === '-' ? 'Guest' : guestName
  if (guestCount > 1) return `${baseName} + ${guestCount - 1}`
  return baseName
}

export const getGrandTotal = (booking) =>
  toNumber(
    booking?.pricing_summary?.grand_total ||
      booking?.pricing?.grand_total ||
      booking?.pricing_summary?.total_price ||
      booking?.total_amount ||
      booking?.total_price,
    0,
  )

export const getStatusColor = (status) => {
  const normalized = normalizeStatus(status)
  if (!normalized) return 'secondary'
  if (['accepted', 'confirmed', 'checked_in', 'active', 'success'].includes(normalized))
    return 'success'
  if (['pending', 'hold', 'awaiting_payment'].includes(normalized)) return 'warning'
  if (['cancelled', 'rejected', 'failed', 'refunded'].includes(normalized)) return 'danger'
  if (['checked_out', 'completed', 'done', 'paid'].includes(normalized)) return 'info'
  return 'secondary'
}
