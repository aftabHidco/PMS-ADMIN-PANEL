import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBan,
  cilCheckCircle,
  cilChevronLeft,
  cilChevronRight,
  cilCloudUpload,
  cilFilter,
  cilFilterX,
  cilMagnifyingGlass,
  cilPlus,
  cilReload,
  cilTrash,
  cilX,
  cilXCircle,
} from '@coreui/icons'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCollapse,
  CCol,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const INITIAL_FILTERS = {
  search: '',
  property_id: '',
  booking_status: '',
  checkin_from: '',
  checkin_to: '',
}

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'pan', label: 'PAN' },
  { value: 'driving_license', label: 'Driving License' },

]

const createUploadPerson = (overrides = {}) => ({
  person_name: '',
  relation: '',
  document_type: 'id_proof',
  note: '',
  files: [],
  ...overrides,
})

const revokePersonFilePreviews = (people = []) => {
  people.forEach((person) => {
    ;(person?.files || []).forEach((fileItem) => {
      if (fileItem?.preview) {
        URL.revokeObjectURL(fileItem.preview)
      }
    })
  })
}

const normalizeFileUrls = (source) => {
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

const normalizeUploadedDocuments = (payload) => {
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

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.bookings)) return payload.bookings
  return []
}

const extractObject = (payload) => {
  if (!payload) return null
  if (Array.isArray(payload)) return payload[0] || null
  if (payload?.data && !Array.isArray(payload.data) && typeof payload.data === 'object') {
    return payload.data
  }
  if (payload?.booking && typeof payload.booking === 'object') return payload.booking
  return payload
}

const normalizeStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

const formatStatusLabel = (value) => {
  const text = String(value || '')
    .replace(/_/g, ' ')
    .trim()
  if (!text) return '-'
  return text
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const parseDateValue = (value) => {
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

const toDateOnly = (value) => {
  const date = parseDateValue(value)
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const normalizeDateFilterValue = (value) => {
  const date = parseDateValue(value)
  if (!date) return value
  return date.toLocaleDateString('en-GB')
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB')
}

const formatDateTime = (value) => {
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

const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const formatCurrency = (value) => {
  const amount = toNumber(value, 0)
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const inDateRange = (value, from, to) => {
  if (!from && !to) return true
  const current = toDateOnly(value)
  if (!current) return false

  const start = toDateOnly(from)
  const end = toDateOnly(to)
  if (start && current < start) return false
  if (end && current > end) return false
  return true
}

const getBookingId = (booking) => booking?.booking_id || booking?.id || booking?.bookingId

const getBookingCode = (booking) =>
  booking?.booking_code ||
  booking?.booking_no ||
  booking?.booking_number ||
  booking?.reference_no ||
  booking?.reference ||
  '-'

const getGuestName = (booking) =>
  booking?.user?.full_name ||
  booking?.guest?.full_name ||
  booking?.guest_name ||
  booking?.customer_name ||
  booking?.full_name ||
  '-'

const getGuestPhone = (booking) =>
  booking?.user?.phone || booking?.guest?.phone || booking?.phone || booking?.mobile || '-'

const getPropertyId = (booking) =>
  booking?.property_id || booking?.property?.property_id || booking?.property?.id || ''

const getPropertyName = (booking, propertyMap) =>
  booking?.property?.property_name ||
  booking?.property_name ||
  propertyMap[getPropertyId(booking)] ||
  '-'

const getBookingStatus = (booking) => normalizeStatus(booking?.booking_status || booking?.status)

const getPaymentStatus = (booking) =>
  normalizeStatus(booking?.payment_status || booking?.payment?.status || booking?.paymentStatus)

const getCheckinDate = (booking) =>
  booking?.checkin_date || booking?.check_in || booking?.start_date || booking?.from_date || ''

const getCheckoutDate = (booking) =>
  booking?.checkout_date || booking?.check_out || booking?.end_date || booking?.to_date || ''

const getCreatedAt = (booking) =>
  booking?.created_at || booking?.createdAt || booking?.booking_date || booking?.date || ''

const getUpdatedAt = (booking) =>
  booking?.audit?.updated_at || booking?.updated_at || booking?.updatedAt || ''

const getCreatedAuditAt = (booking) => booking?.audit?.created_at || getCreatedAt(booking)

const getStayNightsValue = (booking) => {
  const apiStayNights = Number(booking?.stay_nights)
  if (Number.isFinite(apiStayNights) && apiStayNights >= 0) return apiStayNights
  return getStayNights(booking) ?? 0
}

const getPaymentTotalAmount = (booking) =>
  toNumber(booking?.payment_summary?.total_amount || booking?.total_amount || getGrandTotal(booking), 0)

const getTaxAmount = (booking) =>
  toNumber(
    booking?.payment_summary?.total_tax_amount ??
      booking?.pricing_summary?.tax_amount ??
      booking?.tax_amount ??
      booking?.total_tax_amount,
    0,
  )

const getPaymentTotalPaid = (booking) => {
  if (booking?.payment_summary?.total_paid !== undefined) {
    return toNumber(booking.payment_summary.total_paid, 0)
  }

  if (Array.isArray(booking?.payments) && booking.payments.length > 0) {
    return booking.payments.reduce((sum, payment) => sum + toNumber(payment?.amount, 0), 0)
  }

  return 0
}

const getPaymentOutstanding = (booking) => {
  if (booking?.payment_summary?.outstanding_amount !== undefined) {
    return toNumber(booking.payment_summary.outstanding_amount, 0)
  }
  return Math.max(0, getPaymentTotalAmount(booking) - getPaymentTotalPaid(booking))
}

const getBookingSource = (booking) => booking?.source || booking?.booking_source || '-'

const getBookingNotes = (booking) => booking?.notes || booking?.note || '-'

const getRoomSummaryRows = (booking) => {
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

const getStayNights = (booking) => {
  const checkin = toDateOnly(getCheckinDate(booking))
  const checkout = toDateOnly(getCheckoutDate(booking))
  if (!checkin || !checkout) return null

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.max(0, Math.round((checkout.getTime() - checkin.getTime()) / msPerDay))
}

const getGuestCount = (booking) =>
  toNumber(booking?.num_guests || booking?.guests || booking?.guest_count, 0)

const getPersonLabel = (booking) => {
  const guestCount = getGuestCount(booking)
  const guestName = getGuestName(booking)
  const baseName = guestName === '-' ? 'Guest' : guestName
  if (guestCount > 1) return `${baseName} + ${guestCount - 1}`
  return baseName
}

const getGrandTotal = (booking) =>
  toNumber(
    booking?.pricing_summary?.grand_total ||
      booking?.pricing?.grand_total ||
      booking?.pricing_summary?.total_price ||
      booking?.total_amount ||
      booking?.total_price,
    0,
  )

const getStatusColor = (status) => {
  const normalized = normalizeStatus(status)
  if (!normalized) return 'secondary'
  if (['accepted', 'confirmed', 'checked_in', 'active', 'success'].includes(normalized))
    return 'success'
  if (['pending', 'hold', 'awaiting_payment'].includes(normalized)) return 'warning'
  if (['cancelled', 'rejected', 'failed', 'refunded'].includes(normalized)) return 'danger'
  if (['checked_out', 'completed', 'done', 'paid'].includes(normalized)) return 'info'
  return 'secondary'
}

const BookingList = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE
  const loggedUserRole = normalizeStatus(auth?.user?.role || auth?.user?.Role?.role_name || '')
  const showPropertyColumn = loggedUserRole !== 'admin'

  const [bookings, setBookings] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionState, setActionState] = useState({ bookingId: null, action: '' })

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [sortField, setSortField] = useState('checkin_date')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const perPage = 10

  const [detailsVisible, setDetailsVisible] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  const [uploadVisible, setUploadVisible] = useState(false)
  const [uploadBooking, setUploadBooking] = useState(null)
  const [uploadPeople, setUploadPeople] = useState([createUploadPerson()])
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [uploadedDocumentsLoading, setUploadedDocumentsLoading] = useState(false)
  const [uploadedDocumentsError, setUploadedDocumentsError] = useState('')

  const [cancelVisible, setCancelVisible] = useState(false)
  const [cancelBooking, setCancelBooking] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')

  const loadBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings?_page=1&_perPage=500`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.message || 'Failed to load bookings')
        setBookings([])
        return
      }
      setBookings(extractArray(data))
    } catch (err) {
      console.error('Failed to load bookings:', err)
      setError('Failed to load bookings')
      setBookings([])
    }
  }, [API_BASE, auth])

  const loadProperties = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/properties?_perPage=500`, {
        headers: { ...auth.getAuthHeader() },
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setProperties(extractArray(data))
      }
    } catch (err) {
      console.error('Failed to load properties:', err)
    }
  }, [API_BASE, auth])

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true)
      setError('')
      await Promise.all([loadBookings(), loadProperties()])
      setLoading(false)
    }
    bootstrap()
  }, [loadBookings, loadProperties])

  const propertyMap = useMemo(() => {
    const map = {}
    properties.forEach((property) => {
      const id = property?.property_id || property?.id
      if (id) {
        map[id] = property?.property_name || property?.name || `Property ${id}`
      }
    })
    return map
  }, [properties])

  const uniqueBookingStatuses = useMemo(() => {
    const statuses = new Set()
    bookings.forEach((booking) => {
      const status = getBookingStatus(booking)
      if (status) statuses.add(status)
    })
    return Array.from(statuses)
  }, [bookings])

  const pendingBookingsCount = useMemo(() => {
    let count = 0
    bookings.forEach((booking) => {
      if (getBookingStatus(booking) === 'pending') count += 1
    })
    return count
  }, [bookings])

  const uploadedDocumentsByPerson = useMemo(() => {
    const grouped = {}
    uploadedDocuments.forEach((doc) => {
      const personName = doc.person_name || 'Person'
      if (!grouped[personName]) grouped[personName] = []
      grouped[personName].push(doc)
    })
    return grouped
  }, [uploadedDocuments])

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setPage(1)
  }

  const handleDateFilterBlur = (field, value) => {
    const normalized = normalizeDateFilterValue(value)
    if (normalized !== value) {
      updateFilter(field, normalized)
    }
  }

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS)
    setPage(1)
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const bookingStatus = getBookingStatus(booking)
      const paymentStatus = getPaymentStatus(booking)
      const propertyId = String(getPropertyId(booking) || '')
      const checkinDate = getCheckinDate(booking)

      const combinedText =
        `${getBookingCode(booking)} ${getGuestName(booking)} ${getGuestPhone(booking)} ${getPropertyName(booking, propertyMap)} ${bookingStatus} ${paymentStatus}`.toLowerCase()
      if (filters.search && !combinedText.includes(filters.search.toLowerCase())) return false
      if (filters.property_id && filters.property_id !== propertyId) return false
      if (filters.booking_status && normalizeStatus(filters.booking_status) !== bookingStatus)
        return false
      if (!inDateRange(checkinDate, filters.checkin_from, filters.checkin_to)) return false

      return true
    })
  }, [bookings, filters, propertyMap])

  const sortedBookings = useMemo(() => {
    const getSortValue = (booking) => {
      if (sortField === 'booking_code') return getBookingCode(booking).toLowerCase()
      if (sortField === 'guest_name') return getGuestName(booking).toLowerCase()
      if (sortField === 'property_name') return getPropertyName(booking, propertyMap).toLowerCase()
      if (sortField === 'booking_status') return getBookingStatus(booking)
      if (sortField === 'checkin_date') return new Date(getCheckinDate(booking)).getTime() || 0
      if (sortField === 'tax_amount') return getTaxAmount(booking)
      if (sortField === 'grand_total') return getGrandTotal(booking)
      return new Date(getCreatedAt(booking)).getTime() || 0
    }

    return [...filteredBookings].sort((a, b) => {
      const pendingPriorityA = getBookingStatus(a) === 'pending' ? 0 : 1
      const pendingPriorityB = getBookingStatus(b) === 'pending' ? 0 : 1
      if (pendingPriorityA !== pendingPriorityB) {
        return pendingPriorityA - pendingPriorityB
      }

      const A = getSortValue(a)
      const B = getSortValue(b)

      if (typeof A === 'number' && typeof B === 'number') {
        return sortDir === 'asc' ? A - B : B - A
      }

      const valueA = String(A || '')
      const valueB = String(B || '')
      return sortDir === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
    })
  }, [filteredBookings, sortField, sortDir, propertyMap])

  const totalPages = Math.max(1, Math.ceil(sortedBookings.length / perPage))
  const safePage = Math.min(page, totalPages)
  const tableColSpan = showPropertyColumn ? 8 : 7

  const paginatedBookings = useMemo(() => {
    return sortedBookings.slice((safePage - 1) * perPage, safePage * perPage)
  }, [sortedBookings, safePage])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const runWithFallback = async (attempts) => {
    let lastMessage = 'Request failed'

    for (const attempt of attempts) {
      try {
        const headers = attempt.isFormData
          ? { ...auth.getAuthHeader() }
          : { 'Content-Type': 'application/json', ...auth.getAuthHeader() }

        const res = await fetch(`${API_BASE}${attempt.path}`, {
          method: attempt.method || 'POST',
          headers,
          body: attempt.body
            ? attempt.isFormData
              ? attempt.body
              : JSON.stringify(attempt.body)
            : undefined,
        })

        const data = await res.json().catch(() => null)

        if (res.ok && data?.success !== false) {
          return { ok: true, data }
        }

        lastMessage = data?.message || data?.error || `Request failed (${res.status})`
      } catch (err) {
        lastMessage = err?.message || 'Network error'
      }
    }

    return { ok: false, message: lastMessage }
  }

  const isActionLoading = (bookingId, action) =>
    actionState.bookingId === bookingId && actionState.action === action

  const updateBookingStatus = async (bookingId, status, extraBody = {}) => {
    try {
      const payload = {
        status,
        booking_status: status,
        ...extraBody,
      }

      const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (res.ok && data?.success !== false) {
        return { ok: true, data }
      }

      return {
        ok: false,
        message: data?.message || data?.error || `Request failed (${res.status})`,
      }
    } catch (err) {
      return { ok: false, message: err?.message || 'Network error' }
    }
  }

  const handleAccept = async (booking) => {
    const bookingId = getBookingId(booking)
    if (!bookingId) return

    setActionError('')
    setActionSuccess('')
    setActionState({ bookingId, action: 'accept' })

    const result = await updateBookingStatus(bookingId, 'accepted')

    if (!result.ok) {
      setActionError(result.message || 'Failed to accept booking')
      setActionState({ bookingId: null, action: '' })
      return
    }

    setActionSuccess('Booking accepted successfully.')
    await loadBookings()
    setActionState({ bookingId: null, action: '' })
  }

  const openDetailsModal = async (booking) => {
    setSelectedBooking(booking)
    setDetailsLoading(true)
    setDetailsError('')
    setDetailsVisible(true)

    const bookingId = getBookingId(booking)
    if (!bookingId) {
      setDetailsLoading(false)
      return
    }

    const result = await runWithFallback([
      { path: `/bookings/${bookingId}`, method: 'GET' },
      { path: `/bookings/${bookingId}/details`, method: 'GET' },
      { path: `/bookings/${bookingId}?include=all`, method: 'GET' },
    ])

    if (!result.ok) {
      setDetailsError(result.message || 'Failed to load complete booking details')
      setDetailsLoading(false)
      return
    }

    const completeBooking = extractObject(result.data)
    if (completeBooking && typeof completeBooking === 'object') {
      setSelectedBooking(completeBooking)
    }
    setDetailsLoading(false)
  }

  const loadBookingDocuments = async (bookingId) => {
    setUploadedDocumentsLoading(true)
    setUploadedDocumentsError('')

    const result = await runWithFallback([
      { path: `/bookings/${bookingId}/documents`, method: 'GET' },
      { path: `/booking-documents?booking_id=${bookingId}`, method: 'GET' },
    ])

    if (!result.ok) {
      setUploadedDocuments([])
      setUploadedDocumentsError(result.message || 'Failed to load uploaded documents')
      setUploadedDocumentsLoading(false)
      return
    }

    setUploadedDocuments(normalizeUploadedDocuments(result.data))
    setUploadedDocumentsLoading(false)
  }

  const closeUploadModal = () => {
    revokePersonFilePreviews(uploadPeople)
    setUploadVisible(false)
    setUploadBooking(null)
    setUploadPeople([createUploadPerson()])
    setUploadedDocuments([])
    setUploadedDocumentsError('')
    setUploadedDocumentsLoading(false)
  }

  const openUploadModal = async (booking) => {
    revokePersonFilePreviews(uploadPeople)
    const firstPersonName = getGuestName(booking)
    setUploadBooking(booking)
    setUploadPeople([
      createUploadPerson({
        person_name: firstPersonName && firstPersonName !== '-' ? firstPersonName : '',
      }),
    ])
    setUploadedDocuments([])
    setUploadedDocumentsError('')
    setUploadVisible(true)

    const bookingId = getBookingId(booking)
    if (!bookingId) return

    await loadBookingDocuments(bookingId)
  }

  const addUploadPerson = () => {
    setUploadPeople((prev) => [...prev, createUploadPerson()])
  }

  const removeUploadPerson = (personIndex) => {
    setUploadPeople((prev) => {
      if (prev.length <= 1) return prev
      const next = [...prev]
      const removed = next[personIndex]
      revokePersonFilePreviews(removed ? [removed] : [])
      next.splice(personIndex, 1)
      return next
    })
  }

  const updateUploadPersonField = (personIndex, field, value) => {
    setUploadPeople((prev) =>
      prev.map((person, idx) => (idx === personIndex ? { ...person, [field]: value } : person)),
    )
  }

  const addUploadPersonFiles = (personIndex, event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const fileItems = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setUploadPeople((prev) =>
      prev.map((person, idx) =>
        idx === personIndex ? { ...person, files: [...person.files, ...fileItems] } : person,
      ),
    )
    event.target.value = ''
  }

  const removeUploadPersonFile = (personIndex, fileIndex) => {
    setUploadPeople((prev) =>
      prev.map((person, idx) => {
        if (idx !== personIndex) return person
        const nextFiles = [...person.files]
        const removed = nextFiles[fileIndex]
        if (removed?.preview) {
          URL.revokeObjectURL(removed.preview)
        }
        nextFiles.splice(fileIndex, 1)
        return { ...person, files: nextFiles }
      }),
    )
  }

  const submitDocumentUpload = async () => {
    if (!uploadBooking) return

    const bookingId = getBookingId(uploadBooking)
    if (!bookingId) {
      setActionError('Invalid booking selected.')
      return
    }

    const hasFiles = uploadPeople.some((person) => person.files.length > 0)
    if (!hasFiles) {
      setActionError('Please add at least one document image.')
      return
    }

    setActionError('')
    setActionSuccess('')
    setActionState({ bookingId, action: 'upload' })

    const formData = new FormData()
    formData.append('booking_id', String(bookingId))

    const documentsMeta = []

    uploadPeople.forEach((person, personIndex) => {
      if (person.files.length === 0) return

      const personName = person.person_name.trim() || `Person ${personIndex + 1}`
      const relation = person.relation.trim()
      const note = person.note.trim()
      const documentType = person.document_type || 'id_proof'

      const fileFields = []
      person.files.forEach((fileItem, fileIndex) => {
        const fieldName = `file_${personIndex}_${fileIndex}`
        formData.append(fieldName, fileItem.file)
        formData.append('files', fileItem.file)
        fileFields.push(fieldName)
      })

      documentsMeta.push({
        person_index: personIndex + 1,
        person_name: personName,
        relation: relation || undefined,
        document_type: documentType,
        note: note || undefined,
        files_count: fileFields.length,
        file_fields: fileFields,
      })
    })

    formData.append('documents', JSON.stringify(documentsMeta))
    formData.append('documents_meta', JSON.stringify(documentsMeta))
    formData.append('people_documents', JSON.stringify(documentsMeta))

    const result = await runWithFallback([
      {
        path: `/bookings/${bookingId}/documents/batch`,
        method: 'POST',
        body: formData,
        isFormData: true,
      },
      {
        path: `/bookings/${bookingId}/documents`,
        method: 'POST',
        body: formData,
        isFormData: true,
      },
      { path: `/booking-documents/batch`, method: 'POST', body: formData, isFormData: true },
    ])

    if (!result.ok) {
      setActionError(result.message || 'Failed to upload documents')
      setActionState({ bookingId: null, action: '' })
      return
    }

    revokePersonFilePreviews(uploadPeople)
    setUploadPeople([createUploadPerson()])
    setActionSuccess('Documents uploaded successfully.')
    await Promise.all([loadBookings(), loadBookingDocuments(bookingId)])
    setActionState({ bookingId: null, action: '' })
  }

  const openCancelModal = (booking) => {
    setCancelBooking(booking)
    setCancelReason('')
    setCancelReasonError('')
    setCancelVisible(true)
  }

  const submitCancelBooking = async () => {
    if (!cancelBooking) return

    const bookingId = getBookingId(cancelBooking)
    if (!bookingId) return
    const reason = cancelReason.trim()
    if (!reason) {
      setCancelReasonError('Cancellation reason is required.')
      return
    }
    setCancelReasonError('')

    setActionError('')
    setActionSuccess('')
    setActionState({ bookingId, action: 'cancel' })

    const body = {
      cancellation_reason: reason,
      reason,
    }

    const result = await updateBookingStatus(bookingId, 'cancelled', body)

    if (!result.ok) {
      setActionError(result.message || 'Failed to cancel booking')
      setActionState({ bookingId: null, action: '' })
      return
    }

    setCancelVisible(false)
    setCancelReason('')
    setCancelReasonError('')
    setActionSuccess('Booking cancelled successfully.')
    await loadBookings()
    setActionState({ bookingId: null, action: '' })
  }

  const detailsRoomRows = getRoomSummaryRows(selectedBooking || {})
  const detailsGuests = Array.isArray(selectedBooking?.guests) ? selectedBooking.guests : []
  const detailsDocuments = Array.isArray(selectedBooking?.documents) ? selectedBooking.documents : []
  const detailsPayments = Array.isArray(selectedBooking?.payments) ? selectedBooking.payments : []
  const detailsLocks = Array.isArray(selectedBooking?.locks) ? selectedBooking.locks : []
  const detailsStayNights = selectedBooking ? getStayNightsValue(selectedBooking) : 0

  if (loading) {
    return (
      <div className="text-center my-4">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h4 className="mb-0">
              Bookings
              <CBadge color="warning" className="ms-2">
                ({pendingBookingsCount})
              </CBadge>
            </h4>
            <div className="d-flex gap-2">
              <IconOnlyButton
                icon={showFilters ? cilFilterX : cilFilter}
                tone="default"
                size="sm"
                onClick={() => setShowFilters((prev) => !prev)}
                label={showFilters ? 'Hide Filters' : 'Show Filters'}
              />
              <IconOnlyButton
                icon={cilPlus}
                tone="primary"
                size="sm"
                onClick={() => navigate('/bookings/create')}
                label="Create Booking"
              />
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          {actionError && <CAlert color="danger">{actionError}</CAlert>}
          {actionSuccess && <CAlert color="success">{actionSuccess}</CAlert>}

          <CCollapse visible={showFilters}>
            <CRow className="g-2 mb-3 align-items-end">
              <CCol lg={2}>
                <CFormInput
                  label="Search"
                  placeholder="Booking, guest, phone..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </CCol>
              <CCol lg={2}>
                <CFormSelect
                  label="Property"
                  value={filters.property_id}
                  onChange={(e) => updateFilter('property_id', e.target.value)}
                >
                  <option value="">All</option>
                  {properties.map((property) => {
                    const id = property?.property_id || property?.id
                    return (
                      <option key={id} value={id}>
                        {property?.property_name || property?.name || `Property ${id}`}
                      </option>
                    )
                  })}
                </CFormSelect>
              </CCol>
              <CCol lg={2}>
                <CFormSelect
                  label="Booking Status"
                  value={filters.booking_status}
                  onChange={(e) => updateFilter('booking_status', e.target.value)}
                >
                  <option value="">All</option>
                  {uniqueBookingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol lg={2}>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  label="Check-in From"
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  value={filters.checkin_from}
                  onChange={(e) => updateFilter('checkin_from', e.target.value)}
                  onBlur={(e) => handleDateFilterBlur('checkin_from', e.target.value)}
                />
              </CCol>
              <CCol lg={2}>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  label="Check-in To"
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  value={filters.checkin_to}
                  onChange={(e) => updateFilter('checkin_to', e.target.value)}
                  onBlur={(e) => handleDateFilterBlur('checkin_to', e.target.value)}
                />
              </CCol>
              <CCol lg={2} className="d-flex justify-content-end">
                <IconOnlyButton
                  icon={cilReload}
                  tone="default"
                  size="sm"
                  onClick={resetFilters}
                  label="Reset Filters"
                />
              </CCol>
            </CRow>
          </CCollapse>

          <CTable
            bordered
            hover
            responsive
            className="text-nowrap"
            style={{ minWidth: showPropertyColumn ? '1180px' : '1040px' }}
          >
            <CTableHead color="dark">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell onClick={() => handleSort('booking_code')}>
                  Booking {sortField === 'booking_code' && (sortDir === 'asc' ? '↑' : '↓')}
                </CTableHeaderCell>
                <CTableHeaderCell onClick={() => handleSort('guest_name')}>
                  No. of Person {sortField === 'guest_name' && (sortDir === 'asc' ? '↑' : '↓')}
                </CTableHeaderCell>
                {showPropertyColumn && (
                  <CTableHeaderCell onClick={() => handleSort('property_name')}>
                    Property {sortField === 'property_name' && (sortDir === 'asc' ? '↑' : '↓')}
                  </CTableHeaderCell>
                )}
                <CTableHeaderCell onClick={() => handleSort('checkin_date')}>
                  Stay Dates {sortField === 'checkin_date' && (sortDir === 'asc' ? '↑' : '↓')}
                </CTableHeaderCell>
                <CTableHeaderCell onClick={() => handleSort('tax_amount')}>
                  Tax {sortField === 'tax_amount' && (sortDir === 'asc' ? '↑' : '↓')}
                </CTableHeaderCell>
                <CTableHeaderCell onClick={() => handleSort('booking_status')}>
                  Booking Status {sortField === 'booking_status' && (sortDir === 'asc' ? '↑' : '↓')}
                </CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {paginatedBookings.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={tableColSpan} className="text-center">
                    No bookings found
                  </CTableDataCell>
                </CTableRow>
              ) : (
                paginatedBookings.map((booking, index) => {
                  const bookingId = getBookingId(booking)
                  const bookingStatus = getBookingStatus(booking)
                  const stayNights = getStayNights(booking)

                  const hideAcceptButton = [
                    'accepted',
                    'confirmed',
                    'cancelled',
                    'rejected',
                  ].includes(bookingStatus)
                  const isCancelDisabled = [
                    'cancelled',
                    'rejected',
                    'checked_out',
                    'completed',
                  ].includes(bookingStatus)

                  return (
                    <CTableRow key={bookingId || `${index}-${getBookingCode(booking)}`}>
                      <CTableDataCell>{(safePage - 1) * perPage + index + 1}</CTableDataCell>
                      <CTableDataCell>{getBookingCode(booking)}</CTableDataCell>
                      <CTableDataCell>{getPersonLabel(booking)}</CTableDataCell>
                      {showPropertyColumn && (
                        <CTableDataCell>{getPropertyName(booking, propertyMap)}</CTableDataCell>
                      )}
                      <CTableDataCell>
                        {formatDate(getCheckinDate(booking))} -{' '}
                        {formatDate(getCheckoutDate(booking))}
                        {stayNights !== null ? ` (${stayNights}N)` : ''}
                      </CTableDataCell>
                      <CTableDataCell>{formatCurrency(getTaxAmount(booking))}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={getStatusColor(bookingStatus)}>
                          {formatStatusLabel(bookingStatus)}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex flex-wrap gap-1">
                          <IconOnlyButton
                            icon={cilMagnifyingGlass}
                            tone="info"
                            size="sm"
                            onClick={() => openDetailsModal(booking)}
                            label="View Details"
                          />

                          {!hideAcceptButton && (
                            <IconOnlyButton
                              tone="success"
                              size="sm"
                              disabled={
                                isActionLoading(bookingId, 'accept') ||
                                isActionLoading(bookingId, 'cancel') ||
                                isActionLoading(bookingId, 'upload')
                              }
                              onClick={() => handleAccept(booking)}
                              label="Accept"
                            >
                              {isActionLoading(bookingId, 'accept') ? (
                                <CSpinner size="sm" />
                              ) : (
                                <CIcon icon={cilCheckCircle} />
                              )}
                            </IconOnlyButton>
                          )}

                          <IconOnlyButton
                            icon={cilCloudUpload}
                            tone="primary"
                            size="sm"
                            disabled={
                              isActionLoading(bookingId, 'accept') ||
                              isActionLoading(bookingId, 'cancel') ||
                              isActionLoading(bookingId, 'upload')
                            }
                            onClick={() => openUploadModal(booking)}
                            label="Upload Document"
                          />

                          <IconOnlyButton
                            tone="danger"
                            size="sm"
                            disabled={
                              isCancelDisabled ||
                              isActionLoading(bookingId, 'accept') ||
                              isActionLoading(bookingId, 'cancel') ||
                              isActionLoading(bookingId, 'upload')
                            }
                            onClick={() => openCancelModal(booking)}
                            label="Cancel Booking"
                          >
                            {isActionLoading(bookingId, 'cancel') ? (
                              <CSpinner size="sm" />
                            ) : (
                              <CIcon icon={cilXCircle} />
                            )}
                          </IconOnlyButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              )}
            </CTableBody>
          </CTable>

          <div className="d-flex justify-content-between mt-3">
            <IconOnlyButton
              icon={cilChevronLeft}
              tone="default"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage(Math.max(1, safePage - 1))}
              label="Previous Page"
            />

            <span>
              Page {safePage} of {totalPages}
            </span>

            <IconOnlyButton
              icon={cilChevronRight}
              tone="default"
              size="sm"
              disabled={safePage === totalPages}
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              label="Next Page"
            />
          </div>
        </CCardBody>
      </CCard>

      <CModal size="lg" visible={detailsVisible} onClose={() => setDetailsVisible(false)}>
        <CModalHeader>Booking Details</CModalHeader>
        <CModalBody>
          {detailsLoading ? (
            <div className="text-center py-3">
              <CSpinner color="primary" />
            </div>
          ) : !selectedBooking ? (
            <p>No booking selected.</p>
          ) : (
            <>
              {detailsError && <CAlert color="warning">{detailsError}</CAlert>}

              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <div>
                  <h5 className="mb-1">{getBookingCode(selectedBooking)}</h5>
                  <div className="small text-medium-emphasis">
                    Booking ID: {getBookingId(selectedBooking) || '-'} | Source:{' '}
                    {getBookingSource(selectedBooking)}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <CBadge color={getStatusColor(getBookingStatus(selectedBooking))}>
                    Booking: {formatStatusLabel(getBookingStatus(selectedBooking))}
                  </CBadge>
                  <CBadge color={getStatusColor(getPaymentStatus(selectedBooking))}>
                    Payment: {formatStatusLabel(getPaymentStatus(selectedBooking))}
                  </CBadge>
                </div>
              </div>

              <CRow className="g-2 mb-3">
                <CCol md={3}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-medium-emphasis">Check-in</div>
                    <div className="fw-semibold">{formatDate(getCheckinDate(selectedBooking))}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-medium-emphasis">Check-out</div>
                    <div className="fw-semibold">{formatDate(getCheckoutDate(selectedBooking))}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-medium-emphasis">Stay</div>
                    <div className="fw-semibold">{detailsStayNights}N</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-medium-emphasis">Guests</div>
                    <div className="fw-semibold">{getGuestCount(selectedBooking)}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-medium-emphasis">Total</div>
                    <div className="fw-semibold">
                      {formatCurrency(getPaymentTotalAmount(selectedBooking))}
                    </div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-medium-emphasis">Tax</div>
                    <div className="fw-semibold">{formatCurrency(getTaxAmount(selectedBooking))}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-medium-emphasis">Paid</div>
                    <div className="fw-semibold">
                      {formatCurrency(getPaymentTotalPaid(selectedBooking))}
                    </div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-medium-emphasis">Outstanding</div>
                    <div className="fw-semibold">
                      {formatCurrency(getPaymentOutstanding(selectedBooking))}
                    </div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="border rounded p-2 h-100">
                    <div className="small text-medium-emphasis">Updated</div>
                    <div className="fw-semibold">
                      {formatDateTime(getUpdatedAt(selectedBooking) || getCreatedAuditAt(selectedBooking))}
                    </div>
                  </div>
                </CCol>
              </CRow>

              <CRow className="g-2 mb-3">
                <CCol md={6}>
                  <div className="border rounded p-2 h-100">
                    <div className="fw-semibold mb-1">Lead Guest</div>
                    <div>
                      <strong>Name:</strong>{' '}
                      {selectedBooking?.user?.full_name || getGuestName(selectedBooking)}
                    </div>
                    <div>
                      <strong>Phone:</strong> {selectedBooking?.user?.phone || getGuestPhone(selectedBooking)}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedBooking?.user?.email || '-'}
                    </div>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="border rounded p-2 h-100">
                    <div className="fw-semibold mb-1">Property</div>
                    <div>
                      <strong>Name:</strong> {getPropertyName(selectedBooking, propertyMap)}
                    </div>
                    <div>
                      <strong>Code:</strong> {selectedBooking?.property?.property_code || '-'}
                    </div>
                    <div>
                      <strong>Location:</strong>{' '}
                      {[selectedBooking?.property?.city, selectedBooking?.property?.state]
                        .filter(Boolean)
                        .join(', ') || '-'}
                    </div>
                    <div>
                      <strong>Address:</strong> {selectedBooking?.property?.address || '-'}
                    </div>
                  </div>
                </CCol>
              </CRow>

              {getBookingNotes(selectedBooking) !== '-' && (
                <div className="border rounded p-2 mb-3">
                  <div className="fw-semibold mb-1">Notes</div>
                  <div>{getBookingNotes(selectedBooking)}</div>
                </div>
              )}

              {detailsRoomRows.length > 0 && (
                <>
                  <h6 className="mb-2">Room Summary</h6>
                  <CTable small bordered responsive className="mb-3">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Room Type</CTableHeaderCell>
                        <CTableHeaderCell>Qty</CTableHeaderCell>
                        <CTableHeaderCell>Unit/Night</CTableHeaderCell>
                        <CTableHeaderCell>Amount</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {detailsRoomRows.map((row) => (
                        <CTableRow key={row.key}>
                          <CTableDataCell>{row.roomType}</CTableDataCell>
                          <CTableDataCell>{row.qty}</CTableDataCell>
                          <CTableDataCell>{formatCurrency(row.unitPrice)}</CTableDataCell>
                          <CTableDataCell>{formatCurrency(row.amount)}</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </>
              )}

              {detailsGuests.length > 0 && (
                <>
                  <h6 className="mb-2">Guest List</h6>
                  <CTable small bordered responsive className="mb-3">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Name</CTableHeaderCell>
                        <CTableHeaderCell>Phone</CTableHeaderCell>
                        <CTableHeaderCell>Email</CTableHeaderCell>
                        <CTableHeaderCell>ID Proof</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {detailsGuests.map((guest, idx) => (
                        <CTableRow key={`guest-${guest.guest_id || idx}`}>
                          <CTableDataCell>{guest?.guest_name || '-'}</CTableDataCell>
                          <CTableDataCell>{guest?.guest_phone || '-'}</CTableDataCell>
                          <CTableDataCell>{guest?.guest_email || '-'}</CTableDataCell>
                          <CTableDataCell>{guest?.id_proof_type || '-'}</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </>
              )}

              {detailsDocuments.length > 0 && (
                <>
                  <h6 className="mb-2">Documents</h6>
                  <CTable small bordered responsive className="mb-3">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Person</CTableHeaderCell>
                        <CTableHeaderCell>Relation</CTableHeaderCell>
                        <CTableHeaderCell>Type</CTableHeaderCell>
                        <CTableHeaderCell>Note</CTableHeaderCell>
                        <CTableHeaderCell>Files</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {detailsDocuments.map((doc, idx) => {
                        const fileUrls = normalizeFileUrls(doc)
                        return (
                          <CTableRow key={`doc-${doc.document_id || idx}`}>
                            <CTableDataCell>{doc?.person_name || '-'}</CTableDataCell>
                            <CTableDataCell>{doc?.relation || '-'}</CTableDataCell>
                            <CTableDataCell>{formatStatusLabel(doc?.document_type)}</CTableDataCell>
                            <CTableDataCell>{doc?.note || '-'}</CTableDataCell>
                            <CTableDataCell>
                              {fileUrls.length === 0 ? (
                                <span className="text-medium-emphasis">No files</span>
                              ) : (
                                <div className="d-flex flex-wrap gap-2">
                                  {fileUrls.map((url, fileIndex) => (
                                    <a
                                      key={`${doc.document_id || idx}-${fileIndex}`}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      File {fileIndex + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                </>
              )}

              {detailsPayments.length > 0 && (
                <>
                  <h6 className="mb-2">Payments</h6>
                  <CTable small bordered responsive className="mb-3">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Mode</CTableHeaderCell>
                        <CTableHeaderCell>Amount</CTableHeaderCell>
                        <CTableHeaderCell>Tax</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell>Transaction ID</CTableHeaderCell>
                        <CTableHeaderCell>Time</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {detailsPayments.map((payment, idx) => (
                        <CTableRow key={`payment-${payment.payment_id || idx}`}>
                          <CTableDataCell>{payment?.payment_mode || payment?.provider || '-'}</CTableDataCell>
                          <CTableDataCell>{formatCurrency(payment?.amount)}</CTableDataCell>
                          <CTableDataCell>{formatCurrency(payment?.tax_amount)}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={getStatusColor(payment?.status)}>
                              {formatStatusLabel(payment?.status)}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>{payment?.transaction_id || '-'}</CTableDataCell>
                          <CTableDataCell>{formatDateTime(payment?.created_at)}</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </>
              )}

              {detailsLocks.length > 0 && (
                <>
                  <h6 className="mb-2">Inventory Locks</h6>
                  <CTable small bordered responsive className="mb-3">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Date</CTableHeaderCell>
                        <CTableHeaderCell>Room Type</CTableHeaderCell>
                        <CTableHeaderCell>Units</CTableHeaderCell>
                        <CTableHeaderCell>Locked Until</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {detailsLocks.map((lock, idx) => (
                        <CTableRow key={`lock-${lock.lock_id || idx}`}>
                          <CTableDataCell>{formatDate(lock?.lock_date)}</CTableDataCell>
                          <CTableDataCell>{lock?.room_type?.room_type_name || lock?.room_type_id || '-'}</CTableDataCell>
                          <CTableDataCell>{toNumber(lock?.units_locked, 0)}</CTableDataCell>
                          <CTableDataCell>{formatDateTime(lock?.locked_until)}</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </>
              )}

              {selectedBooking?.audit && (
                <div className="border rounded p-2 small">
                  <div className="fw-semibold mb-1">Audit</div>
                  <div>
                    <strong>Created:</strong> {formatDateTime(selectedBooking.audit.created_at)} |{' '}
                    <strong>Updated:</strong> {formatDateTime(selectedBooking.audit.updated_at)}
                  </div>
                  <div>
                    <strong>Created By:</strong> {selectedBooking.audit.created_by || '-'} |{' '}
                    <strong>Updated By:</strong> {selectedBooking.audit.updated_by || '-'}
                  </div>
                  <div>
                    <strong>IP:</strong> {selectedBooking.audit.ip_address || '-'}
                  </div>
                </div>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <IconOnlyButton
            icon={cilX}
            tone="default"
            label="Close Details"
            onClick={() => setDetailsVisible(false)}
          />
        </CModalFooter>
      </CModal>

      <CModal size="lg" visible={uploadVisible} onClose={closeUploadModal}>
        <CModalHeader>Upload Booking Documents</CModalHeader>
        <CModalBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <strong>Booking:</strong> {uploadBooking ? getBookingCode(uploadBooking) : '-'}
            </div>
            <IconOnlyButton
              icon={cilPlus}
              tone="primary"
              size="sm"
              label="Add Person"
              onClick={addUploadPerson}
            />
          </div>

          {uploadPeople.map((person, personIndex) => (
            <div key={`person-${personIndex}`} className="border rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Person {personIndex + 1}</h6>
                {uploadPeople.length > 1 && (
                  <IconOnlyButton
                    icon={cilTrash}
                    tone="danger"
                    size="sm"
                    label="Remove Person"
                    onClick={() => removeUploadPerson(personIndex)}
                  />
                )}
              </div>

              <CRow className="g-2">
                <CCol md={4}>
                  <CFormInput
                    label="Person Name"
                    placeholder="Enter person name"
                    value={person.person_name}
                    onChange={(e) =>
                      updateUploadPersonField(personIndex, 'person_name', e.target.value)
                    }
                  />
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    label="Relation (optional)"
                    placeholder="Relation with guest"
                    value={person.relation}
                    onChange={(e) =>
                      updateUploadPersonField(personIndex, 'relation', e.target.value)
                    }
                  />
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    label="Document Type"
                    value={person.document_type}
                    onChange={(e) =>
                      updateUploadPersonField(personIndex, 'document_type', e.target.value)
                    }
                  >
                    {DOCUMENT_TYPE_OPTIONS.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CFormInput
                type="file"
                multiple
                accept="image/*"
                className="mt-2"
                label="Upload Images"
                onChange={(e) => addUploadPersonFiles(personIndex, e)}
              />

              <CFormInput
                label="Note (optional)"
                className="mt-2"
                placeholder="Add note for this person's documents"
                value={person.note}
                onChange={(e) => updateUploadPersonField(personIndex, 'note', e.target.value)}
              />

              {person.files.length > 0 && (
                <>
                  <div className="small text-medium-emphasis mt-2 mb-1">
                    Selected Images ({person.files.length})
                  </div>
                  <CRow className="g-2">
                    {person.files.map((fileItem, fileIndex) => (
                      <CCol md={3} key={`${personIndex}-${fileIndex}`}>
                        <div className="border rounded p-2 h-100">
                          <img
                            src={fileItem.preview}
                            alt="preview"
                            style={{
                              width: '100%',
                              height: 120,
                              objectFit: 'cover',
                              borderRadius: 6,
                            }}
                          />
                          <div
                            className="small text-truncate mt-1"
                            title={fileItem.file?.name || `file-${fileIndex + 1}`}
                          >
                            {fileItem.file?.name || `file-${fileIndex + 1}`}
                          </div>
                          <IconOnlyButton
                            icon={cilTrash}
                            tone="danger"
                            size="sm"
                            className="w-100 mt-1"
                            label="Remove File"
                            onClick={() => removeUploadPersonFile(personIndex, fileIndex)}
                          />
                        </div>
                      </CCol>
                    ))}
                  </CRow>
                </>
              )}
            </div>
          ))}

          <hr />
          <h6>Uploaded Images</h6>

          {uploadedDocumentsLoading ? (
            <div className="text-center py-2">
              <CSpinner color="primary" />
            </div>
          ) : uploadedDocumentsError ? (
            <CAlert color="warning" className="mb-0">
              {uploadedDocumentsError}
            </CAlert>
          ) : uploadedDocuments.length === 0 ? (
            <p className="text-medium-emphasis mb-0">
              No uploaded documents found for this booking.
            </p>
          ) : (
            Object.entries(uploadedDocumentsByPerson).map(([personName, docs]) => (
              <div key={personName} className="border rounded p-2 mb-2">
                <div className="fw-semibold mb-2">{personName}</div>
                {docs.map((doc, docIndex) => (
                  <div key={`${doc.document_id}-${docIndex}`} className="mb-2">
                    <div className="small text-medium-emphasis mb-1">
                      {formatStatusLabel(doc.document_type)}
                      {doc.relation ? ` | ${doc.relation}` : ''}
                      {doc.note ? ` | ${doc.note}` : ''}
                    </div>
                    {doc.file_urls.length > 0 ? (
                      <CRow className="g-2">
                        {doc.file_urls.map((url, urlIndex) => (
                          <CCol md={2} key={`${doc.document_id}-${urlIndex}`}>
                            <img
                              src={url}
                              alt="uploaded"
                              style={{
                                width: '100%',
                                height: 90,
                                objectFit: 'cover',
                                borderRadius: 6,
                                border: '1px solid #ddd',
                              }}
                            />
                          </CCol>
                        ))}
                      </CRow>
                    ) : (
                      <small className="text-medium-emphasis">No images in this document.</small>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </CModalBody>
        <CModalFooter>
          <IconOnlyButton
            icon={cilX}
            tone="default"
            label="Close Upload Modal"
            onClick={closeUploadModal}
          />
          <IconOnlyButton
            tone="primary"
            onClick={submitDocumentUpload}
            disabled={
              !uploadBooking ||
              isActionLoading(getBookingId(uploadBooking), 'upload') ||
              isActionLoading(getBookingId(uploadBooking), 'accept') ||
              isActionLoading(getBookingId(uploadBooking), 'cancel')
            }
            label="Upload Documents"
          >
            {uploadBooking && isActionLoading(getBookingId(uploadBooking), 'upload') ? (
              <CSpinner size="sm" />
            ) : (
              <CIcon icon={cilCloudUpload} />
            )}
          </IconOnlyButton>
        </CModalFooter>
      </CModal>

      <CModal visible={cancelVisible} onClose={() => setCancelVisible(false)}>
        <CModalHeader>Cancel Booking</CModalHeader>
        <CModalBody>
          <p className="mb-2">
            Booking: <strong>{cancelBooking ? getBookingCode(cancelBooking) : '-'}</strong>
          </p>
          {cancelReasonError && (
            <CAlert color="warning" className="mb-2">
              {cancelReasonError}
            </CAlert>
          )}
          <CFormTextarea
            label="Cancellation Reason"
            rows={3}
            placeholder="Enter cancellation reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </CModalBody>
        <CModalFooter>
          <IconOnlyButton
            icon={cilX}
            tone="default"
            label="Close Cancel Modal"
            onClick={() => setCancelVisible(false)}
          />
          <IconOnlyButton
            tone="danger"
            onClick={submitCancelBooking}
            disabled={
              !cancelBooking ||
              !cancelReason.trim() ||
              isActionLoading(getBookingId(cancelBooking), 'cancel') ||
              isActionLoading(getBookingId(cancelBooking), 'accept') ||
              isActionLoading(getBookingId(cancelBooking), 'upload')
            }
            label="Confirm Cancel Booking"
          >
            {cancelBooking && isActionLoading(getBookingId(cancelBooking), 'cancel') ? (
              <CSpinner size="sm" />
            ) : (
              <CIcon icon={cilBan} />
            )}
          </IconOnlyButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default BookingList
