import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { cilFilter, cilFilterX, cilPlus } from '@coreui/icons'
import { CAlert, CBadge, CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'
import BookingListFilters from './components/BookingListFilters'
import BookingTable from './components/BookingTable'
import BookingPagination from './components/BookingPagination'
import BookingDetailsModal from './components/modals/BookingDetailsModal'
import BookingUploadModal from './components/modals/BookingUploadModal'
import BookingRefundModal from './components/modals/BookingRefundModal'
import BookingCancelModal from './components/modals/BookingCancelModal'
import {
  INITIAL_FILTERS,
  CUSTOM_POLICY_VALUE,
  createUploadPerson,
  revokePersonFilePreviews,
  normalizeUploadedDocuments,
  extractArray,
  extractObject,
  normalizeStatus,
  normalizeDateFilterValue,
  inDateRange,
  getBookingId,
  getBookingCancellationPolicyId,
  getBookingCode,
  getGuestName,
  getGuestPhone,
  getPropertyId,
  getPropertyName,
  getBookingStatus,
  getPaymentStatus,
  getCheckinDate,
  getCreatedAt,
  getTaxAmount,
  getGrandTotal,
  toNumber,
  calculateCancellationAmounts,
  formatCurrency,
} from './bookingListUtils'

const BookingList = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE
  const loggedUserRole = normalizeStatus(auth?.user?.role || auth?.user?.Role?.role_name || '')
  const showPropertyColumn = loggedUserRole !== 'admin'

  const [bookings, setBookings] = useState([])
  const [properties, setProperties] = useState([])
  const [cancellationPolicies, setCancellationPolicies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionState, setActionState] = useState({ bookingId: null, action: '' })

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [activeListTab, setActiveListTab] = useState('all')
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

  const [refundVisible, setRefundVisible] = useState(false)
  const [refundBooking, setRefundBooking] = useState(null)
  const [refundLoading, setRefundLoading] = useState(false)
  const [refundError, setRefundError] = useState('')
  const [refundContext, setRefundContext] = useState(null)
  const [refundEligibility, setRefundEligibility] = useState(null)
  const [refundPolicyId, setRefundPolicyId] = useState('')
  const [refundAppliedCancellation, setRefundAppliedCancellation] = useState(null)
  const [refundAmountTouched, setRefundAmountTouched] = useState(false)
  const [refundForm, setRefundForm] = useState({
    payment_id: '',
    refund_amount: '',
    custom_deduction_percentage: '',
    refund_reason: 'Guest cancelled',
  })

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

  const loadCancellationPolicies = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/cancellation-policies?_page=1&_perPage=100`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setCancellationPolicies([])
        return []
      }
      const items = extractArray(data)
      setCancellationPolicies(items)
      return items
    } catch (err) {
      console.error('Failed to load cancellation policies:', err)
      setCancellationPolicies([])
      return []
    }
  }, [API_BASE, auth])

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users?_page=1&_perPage=500`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setUsers(extractArray(data))
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setUsers([])
    }
  }, [API_BASE, auth])

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true)
      setError('')
      await Promise.all([loadBookings(), loadProperties(), loadCancellationPolicies(), loadUsers()])
      setLoading(false)
    }
    bootstrap()
  }, [loadBookings, loadProperties, loadCancellationPolicies, loadUsers])

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

  const userMap = useMemo(() => {
    const map = {}
    users.forEach((user) => {
      const id = user?.user_id || user?.id
      const name = user?.full_name || user?.name || user?.user_name || ''
      if (id && name) {
        map[String(id)] = name
      }
    })
    return map
  }, [users])

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

  const cancelledBookingsCount = useMemo(() => {
    let count = 0
    bookings.forEach((booking) => {
      if (getBookingStatus(booking) === 'cancelled') count += 1
    })
    return count
  }, [bookings])

  const updateFilter = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setPage(1)
  }, [])

  const handleDateFilterBlur = useCallback(
    (field, value) => {
      const normalized = normalizeDateFilterValue(value)
      if (normalized !== value) {
        updateFilter(field, normalized)
      }
    },
    [updateFilter],
  )

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
    setPage(1)
  }, [])

  const filteredBookings = useMemo(() => {
    const effectiveBookingStatus =
      activeListTab === 'cancelled' ? 'cancelled' : filters.booking_status

    return bookings.filter((booking) => {
      const bookingStatus = getBookingStatus(booking)
      const paymentStatus = getPaymentStatus(booking)
      const propertyId = String(getPropertyId(booking) || '')
      const checkinDate = getCheckinDate(booking)

      const combinedText =
        `${getBookingCode(booking)} ${getGuestName(booking)} ${getGuestPhone(booking)} ${getPropertyName(booking, propertyMap)} ${bookingStatus} ${paymentStatus}`.toLowerCase()
      if (filters.search && !combinedText.includes(filters.search.toLowerCase())) return false
      if (filters.property_id && filters.property_id !== propertyId) return false
      if (effectiveBookingStatus && normalizeStatus(effectiveBookingStatus) !== bookingStatus)
        return false
      if (!inDateRange(checkinDate, filters.checkin_from, filters.checkin_to)) return false

      return true
    })
  }, [activeListTab, bookings, filters, propertyMap])

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
  const paginatedBookings = useMemo(() => {
    return sortedBookings.slice((safePage - 1) * perPage, safePage * perPage)
  }, [sortedBookings, safePage])

  const handleTabChange = useCallback((nextTab) => {
    setActiveListTab(nextTab)
    setPage(1)
  }, [])

  const handlePrevPage = useCallback(() => {
    setPage(Math.max(1, safePage - 1))
  }, [safePage])

  const handleNextPage = useCallback(() => {
    setPage(Math.min(totalPages, safePage + 1))
  }, [safePage, totalPages])

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev)
  }, [])

  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField],
  )

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

  const closeCancelModal = () => {
    setCancelVisible(false)
    setCancelBooking(null)
    setCancelReason('')
    setCancelReasonError('')
  }

  const openCancelModal = (booking) => {
    if (cancellationPolicies.length === 0) {
      loadCancellationPolicies()
    }
    setCancelBooking(booking)
    setCancelReason('')
    setCancelReasonError('')
    setCancelVisible(true)
  }

  const closeRefundModal = () => {
    setRefundVisible(false)
    setRefundBooking(null)
    setRefundLoading(false)
    setRefundError('')
    setRefundContext(null)
    setRefundEligibility(null)
    setRefundPolicyId('')
    setRefundAppliedCancellation(null)
    setRefundAmountTouched(false)
    setRefundForm({
      payment_id: '',
      refund_amount: '',
      custom_deduction_percentage: '',
      refund_reason: 'Guest cancelled',
    })
  }

  const handleRefundPolicyChange = (nextPolicyId) => {
    setRefundPolicyId(nextPolicyId)
    setRefundAmountTouched(false)
  }

  const openRefundModal = async (booking) => {
    const bookingId = getBookingId(booking)
    if (!bookingId) {
      setActionError('Invalid booking selected for refund.')
      return
    }

    const loadedPolicies =
      cancellationPolicies.length > 0 ? cancellationPolicies : await loadCancellationPolicies()

    setRefundVisible(true)
    setRefundBooking(booking)
    setRefundLoading(true)
    setRefundError('')
    setRefundContext(null)
    setRefundEligibility(null)
    setRefundPolicyId('')
    setRefundAppliedCancellation(null)
    setRefundAmountTouched(false)
    setRefundForm({
      payment_id: '',
      refund_amount: '',
      custom_deduction_percentage: '',
      refund_reason: 'Guest cancelled',
    })

    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancellation-context`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body?.success === false) {
        throw new Error(body?.message || 'Failed to fetch cancellation context')
      }

      const payload = body?.data || {}
      const contextPolicies = Array.isArray(payload?.cancellation_policy_list)
        ? payload.cancellation_policy_list
        : []
      const fallbackPolicyId = String(loadedPolicies?.[0]?.id || '')
      const defaultPolicyId = String(
        getBookingCancellationPolicyId(booking) ||
          contextPolicies?.[0]?.cancellation_policy_id ||
          fallbackPolicyId ||
          '',
      )
      const sampleCustomPercentage = payload?.custom_cancellation?.sample_deduction_percentage
      const shouldUseCustom =
        payload?.custom_cancellation?.enabled === true && !defaultPolicyId && sampleCustomPercentage !== undefined

      setRefundContext(payload)
      setRefundPolicyId(shouldUseCustom ? CUSTOM_POLICY_VALUE : defaultPolicyId)
      setRefundForm((prev) => ({
        ...prev,
        custom_deduction_percentage:
          shouldUseCustom && sampleCustomPercentage !== undefined && sampleCustomPercentage !== null
            ? String(sampleCustomPercentage)
            : prev.custom_deduction_percentage,
      }))

      try {
        const eligibilityRes = await fetch(`${API_BASE}/refunds/eligibility/${bookingId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...auth.getAuthHeader(),
          },
        })
        const eligibilityBody = await eligibilityRes.json().catch(() => ({}))
        if (!eligibilityRes.ok || eligibilityBody?.success === false) {
          throw new Error(eligibilityBody?.message || 'Failed to fetch refund eligibility')
        }
        setRefundEligibility(eligibilityBody?.data || {})
      } catch (err) {
        setRefundEligibility(null)
        setRefundError(err.message || 'Failed to fetch refund eligibility')
      }
    } catch (err) {
      setRefundError(err.message || 'Failed to fetch cancellation context')
    } finally {
      setRefundLoading(false)
    }
  }

  useEffect(() => {
    const payments = Array.isArray(refundEligibility?.payments) ? refundEligibility.payments : []
    if (!payments.length) return

    setRefundForm((prev) => {
      if (prev.payment_id) return prev
      const defaultPayment = payments.find((payment) => payment?.can_refund) || payments[0]
      return {
        ...prev,
        payment_id: String(defaultPayment?.payment_id || ''),
      }
    })
  }, [refundEligibility])

  useEffect(() => {
    const payload = refundContext
    if (!payload || !refundPolicyId) {
      setRefundAppliedCancellation(null)
      return
    }

    const isCustomPolicy = refundPolicyId === CUSTOM_POLICY_VALUE
    const policies = Array.isArray(payload?.cancellation_policy_list)
      ? payload.cancellation_policy_list
      : []
    const matched = isCustomPolicy
      ? null
      : policies.find(
        (policy) => String(policy?.cancellation_policy_id) === String(refundPolicyId),
      )

    setRefundAppliedCancellation(matched || null)

    if (isCustomPolicy && refundAmountTouched) {
      return
    }

    const bookingAmount = toNumber(payload?.booking_amount, 0)
    const appliedCustomRefundAmount =
      payload?.applied_cancellation?.is_custom === true
        ? payload?.applied_cancellation?.calculation?.refund_amount
        : null
    const policyRefundAmount = isCustomPolicy
      ? toNumber(
        appliedCustomRefundAmount ??
          payload?.custom_cancellation?.sample_calculation?.refund_amount,
        0,
      )
      : toNumber(matched?.calculation?.refund_amount, 0)
    const payments = Array.isArray(refundEligibility?.payments) ? refundEligibility.payments : []
    const selectedPayment = payments.find(
      (payment) => String(payment?.payment_id) === String(refundForm.payment_id),
    )
    const paymentRemaining = toNumber(
      selectedPayment?.calculation?.refundable_remaining_amount,
      0,
    )
    const suggestedAmount =
      paymentRemaining > 0 && policyRefundAmount > 0
        ? Math.min(paymentRemaining, policyRefundAmount)
        : policyRefundAmount > 0
          ? policyRefundAmount
          : paymentRemaining
    const boundedAmount =
      bookingAmount > 0 && suggestedAmount > bookingAmount
        ? bookingAmount
        : suggestedAmount

    setRefundForm((prev) => {
      const nextRefundAmount = isCustomPolicy && refundAmountTouched
        ? prev.refund_amount
        : boundedAmount > 0
          ? String(boundedAmount)
          : ''
      const nextDeduction =
        isCustomPolicy && !refundAmountTouched
          ? String(
            toNumber(
              payload?.custom_cancellation?.sample_deduction_percentage,
              0,
            ),
          )
          : prev.custom_deduction_percentage
      return {
        ...prev,
        refund_amount: nextRefundAmount,
        custom_deduction_percentage: nextDeduction,
      }
    })
  }, [refundContext, refundEligibility, refundForm.payment_id, refundPolicyId, refundAmountTouched])

  const submitCancelBooking = async () => {
    if (!cancelBooking) return

    const bookingId = getBookingId(cancelBooking)
    if (!bookingId) return
    let policies = cancellationPolicies
    if (policies.length === 0) {
      policies = await loadCancellationPolicies()
    }
    const policyId = String(policies?.[0]?.id || '').trim()
    const reason = cancelReason.trim()
    if (!policyId) {
      setCancelReasonError('No cancellation policy found. Please create one first.')
      return
    }
    setCancelReasonError('')

    setActionError('')
    setActionSuccess('')
    setActionState({ bookingId, action: 'cancel' })

    const body = { cancellation_policy_id: policyId }
    if (reason) {
      body.cancellation_reason = reason
      body.reason = reason
    }

    const result = await updateBookingStatus(bookingId, 'cancelled', body)

    if (!result.ok) {
      setActionError(result.message || 'Failed to cancel booking')
      setActionState({ bookingId: null, action: '' })
      return
    }

    closeCancelModal()
    setActionSuccess('Booking cancelled successfully.')
    await loadBookings()
    setActionState({ bookingId: null, action: '' })
  }

  const submitRefund = async () => {
    if (!refundBooking) return

    const bookingId = getBookingId(refundBooking)
    if (!bookingId) return

    const isCustomPolicy = refundPolicyId === CUSTOM_POLICY_VALUE
    const cancellationPolicyId = isCustomPolicy ? '' : String(refundPolicyId || '').trim()
    const paymentId = Number(refundForm.payment_id)
    let refundAmount = Number(refundForm.refund_amount)
    const refundReason = refundForm.refund_reason.trim()

    if (!isCustomPolicy && !cancellationPolicyId) {
      setRefundError('Cancellation policy is required.')
      return
    }
    if (isCustomPolicy && refundContext?.custom_cancellation?.enabled === false) {
      setRefundError('Custom cancellation is not enabled for this booking.')
      return
    }
    if (!paymentId) {
      setRefundError('Select a payment for refund.')
      return
    }
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      setRefundError('Refund amount must be greater than 0.')
      return
    }
    if (!refundReason) {
      setRefundError('Refund reason is required.')
      return
    }
    if (refundEligibility?.can_refund === false) {
      const reasons =
        Array.isArray(refundEligibility?.reasons) && refundEligibility.reasons.length > 0
          ? refundEligibility.reasons.join(', ')
          : 'Refund is not allowed for this booking.'
      setRefundError(reasons)
      return
    }

    const payments = Array.isArray(refundEligibility?.payments) ? refundEligibility.payments : []
    if (!payments.length) {
      setRefundError('No refundable payment found for this booking.')
      return
    }
    const selectedPayment =
      payments.find((payment) => String(payment?.payment_id) === String(paymentId)) ||
      payments[0] ||
      null
    const paymentRemaining = toNumber(
      selectedPayment?.calculation?.refundable_remaining_amount,
      0,
    )
    const paymentAmount = toNumber(
      selectedPayment?.calculation?.payment_amount ?? selectedPayment?.amount,
      0,
    )
    const bookingAmount = toNumber(refundContext?.booking_amount, 0)

    let deductionPercentage = toNumber(
      refundAppliedCancellation?.deduction_percentage ??
        refundAppliedCancellation?.calculation?.deduction_percentage ??
        selectedPayment?.calculation?.deduction_percentage,
      0,
    )
    let customDeductionPercentage = null
    if (isCustomPolicy) {
      const rawCustom = Number(refundForm.custom_deduction_percentage)
      if (!Number.isFinite(rawCustom) || rawCustom < 0 || rawCustom > 100) {
        setRefundError('Deduction percentage must be between 0 and 100.')
        return
      }
      deductionPercentage = Math.max(0, Math.min(100, rawCustom))
      customDeductionPercentage = deductionPercentage
      const computedRefundAmount = calculateCancellationAmounts(
        bookingAmount,
        deductionPercentage,
      ).refund_amount
      if (!Number.isFinite(computedRefundAmount) || computedRefundAmount <= 0) {
        setRefundError('Refund amount must be greater than 0.')
        return
      }
      if (Number.isFinite(refundAmount) && Math.abs(refundAmount - computedRefundAmount) > 0.01) {
        setRefundForm((prev) => ({
          ...prev,
          refund_amount: String(computedRefundAmount),
        }))
      }
      refundAmount = computedRefundAmount
    }

    const policyMaxRefundable = calculateCancellationAmounts(
      paymentAmount || bookingAmount,
      deductionPercentage,
    ).refund_amount
    const effectiveMaxRefundable =
      paymentRemaining > 0 && policyMaxRefundable > 0
        ? Math.min(paymentRemaining, policyMaxRefundable)
        : policyMaxRefundable > 0
          ? policyMaxRefundable
          : paymentRemaining

    if (effectiveMaxRefundable > 0 && refundAmount > effectiveMaxRefundable + 0.01) {
      setRefundError(
        `Refund amount cannot exceed max refundable amount (${formatCurrency(effectiveMaxRefundable)}).`,
      )
      return
    }

    setRefundError('')
    setActionError('')
    setActionSuccess('')
    setActionState({ bookingId, action: 'refund' })

    try {
      const currentStatus = getBookingStatus(refundBooking)
      if (currentStatus !== 'cancelled') {
        const statusResult = await updateBookingStatus(bookingId, 'cancelled', {
          ...(isCustomPolicy
            ? { custom_deduction_percentage: customDeductionPercentage }
            : { cancellation_policy_id: cancellationPolicyId }),
        })
        if (!statusResult.ok) {
          throw new Error(statusResult.message || 'Failed to apply cancellation policy')
        }
      }

      const eligibilityRes = await fetch(`${API_BASE}/refunds/eligibility/${bookingId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      const eligibilityBody = await eligibilityRes.json().catch(() => ({}))
      if (!eligibilityRes.ok || eligibilityBody?.success === false) {
        throw new Error(eligibilityBody?.message || 'Failed to fetch refund eligibility')
      }

      const latestEligibility = eligibilityBody?.data || {}
      setRefundEligibility(latestEligibility)
      if (latestEligibility?.can_refund === false) {
        const reasons =
          Array.isArray(latestEligibility?.reasons) && latestEligibility.reasons.length > 0
            ? latestEligibility.reasons.join(', ')
            : 'Refund is not allowed for this booking.'
        throw new Error(reasons)
      }

      const latestPayments = Array.isArray(latestEligibility?.payments) ? latestEligibility.payments : []
      const latestSelectedPayment =
        latestPayments.find((payment) => String(payment?.payment_id) === String(paymentId)) ||
        latestPayments[0] ||
        null
      const resolvedPaymentId = Number(latestSelectedPayment?.payment_id || paymentId)

      if (!resolvedPaymentId) {
        throw new Error('No refundable payment found for this booking.')
      }

      const maxRefundableAmount = toNumber(
        latestSelectedPayment?.calculation?.refundable_remaining_amount,
        0,
      )
      if (maxRefundableAmount > 0 && refundAmount > maxRefundableAmount) {
        throw new Error(
          `Refund amount cannot exceed max refundable amount (${formatCurrency(maxRefundableAmount)}).`,
        )
      }

      setRefundForm((prev) => ({
        ...prev,
        payment_id: String(resolvedPaymentId),
      }))

      const payload = {
        payment_id: resolvedPaymentId,
        refund_amount: refundAmount,
        refund_reason: refundReason,
      }

      const res = await fetch(`${API_BASE}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok || body?.success === false) {
        throw new Error(body?.message || 'Failed to create refund')
      }

      closeRefundModal()
      setActionSuccess(body?.message || 'Refund created successfully.')
      await loadBookings()
    } catch (err) {
      setRefundError(err.message || 'Failed to create refund')
    } finally {
      setActionState({ bookingId: null, action: '' })
    }
  }

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
                onClick={toggleFilters}
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

          <BookingListFilters
            activeListTab={activeListTab}
            onTabChange={handleTabChange}
            bookingsCount={bookings.length}
            cancelledBookingsCount={cancelledBookingsCount}
            showFilters={showFilters}
            filters={filters}
            properties={properties}
            uniqueBookingStatuses={uniqueBookingStatuses}
            onFilterChange={updateFilter}
            onDateBlur={handleDateFilterBlur}
            onReset={resetFilters}
          />

          <BookingTable
            bookings={paginatedBookings}
            safePage={safePage}
            perPage={perPage}
            showPropertyColumn={showPropertyColumn}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            activeListTab={activeListTab}
            propertyMap={propertyMap}
            onViewDetails={openDetailsModal}
            onAccept={handleAccept}
            onUpload={openUploadModal}
            onRefund={openRefundModal}
            onCancel={openCancelModal}
            isActionLoading={isActionLoading}
          />

          <BookingPagination
            page={safePage}
            totalPages={totalPages}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
          />
        </CCardBody>
      </CCard>

      <BookingDetailsModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        loading={detailsLoading}
        error={detailsError}
        booking={selectedBooking}
        propertyMap={propertyMap}
        userMap={userMap}
        apiBase={API_BASE}
      />

      <BookingUploadModal
        visible={uploadVisible}
        onClose={closeUploadModal}
        booking={uploadBooking}
        people={uploadPeople}
        onAddPerson={addUploadPerson}
        onRemovePerson={removeUploadPerson}
        onPersonFieldChange={updateUploadPersonField}
        onPersonFilesAdd={addUploadPersonFiles}
        onPersonFileRemove={removeUploadPersonFile}
        uploadedDocuments={uploadedDocuments}
        uploadedDocumentsLoading={uploadedDocumentsLoading}
        uploadedDocumentsError={uploadedDocumentsError}
        onSubmit={submitDocumentUpload}
        isActionLoading={isActionLoading}
      />

      <BookingRefundModal
        visible={refundVisible}
        onClose={closeRefundModal}
        booking={refundBooking}
        loading={refundLoading}
        error={refundError}
        cancellationPolicies={cancellationPolicies}
        policyId={refundPolicyId}
        onPolicyChange={handleRefundPolicyChange}
        refundContext={refundContext}
        appliedCancellation={refundAppliedCancellation}
        eligibility={refundEligibility}
        refundForm={refundForm}
        setRefundForm={setRefundForm}
        setRefundAmountTouched={setRefundAmountTouched}
        onSubmit={submitRefund}
        isActionLoading={isActionLoading}
        propertyMap={propertyMap}
      />

      <BookingCancelModal
        visible={cancelVisible}
        onClose={closeCancelModal}
        booking={cancelBooking}
        cancelReason={cancelReason}
        onCancelReasonChange={setCancelReason}
        cancelReasonError={cancelReasonError}
        cancellationPolicies={cancellationPolicies}
        onSubmit={submitCancelBooking}
        isActionLoading={isActionLoading}
        propertyMap={propertyMap}
      />
    </>
  )
}

export default BookingList
