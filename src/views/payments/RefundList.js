import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { cilChevronLeft, cilChevronRight, cilMagnifyingGlass, cilReload } from '@coreui/icons'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
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
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const PER_PAGE_OPTIONS = [10, 25, 50, 100]
const REFUND_STATUS_OPTIONS = ['', 'pending', 'success', 'failed', 'cancelled']

const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-IN', { hour12: true })
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN')
}

const formatCurrency = (value, currency = 'INR') => {
  const amount = toNumber(value)
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (err) {
    return `${amount.toFixed(2)} ${currency || 'INR'}`
  }
}

const getStatusColor = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'success') return 'success'
  if (normalized === 'pending') return 'warning'
  if (normalized === 'cancelled') return 'secondary'
  return 'danger'
}

const getGuestName = (refund) =>
  refund?.booking?.user?.full_name ||
  refund?.booking?.user?.name ||
  refund?.booking?.guest_name ||
  refund?.booking?.customer_name ||
  '-'

const getPropertyName = (refund) =>
  refund?.booking?.property?.property_name ||
  refund?.booking?.property?.name ||
  refund?.booking?.property_name ||
  '-'

const getBookingCode = (refund) =>
  refund?.booking?.booking_code ||
  refund?.booking?.booking_no ||
  refund?.booking?.booking_number ||
  refund?.booking?.reference_no ||
  '-'

const getStayDates = (refund) => {
  const checkin = refund?.booking?.checkin_date
  const checkout = refund?.booking?.checkout_date
  if (!checkin && !checkout) return '-'
  return `${formatDate(checkin)} - ${formatDate(checkout)}`
}

const buildQueryParams = ({ page, perPage, sortField, sortDir, filters }) => {
  const params = new URLSearchParams({
    _page: String(page),
    _perPage: String(perPage),
    _sortField: sortField,
    _sortDir: sortDir,
  })

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value).trim())
    }
  })

  return params.toString()
}

const RefundList = () => {
  const auth = useAuth()
  const location = useLocation()
  const API_BASE = auth.API_BASE

  const initialBookingId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('booking_id') || ''
  }, [location.search])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refunds, setRefunds] = useState([])
  const [total, setTotal] = useState(0)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [sortField, setSortField] = useState('refund_id')
  const [sortDir, setSortDir] = useState('desc')

  const [filters, setFilters] = useState({
    refund_id: '',
    payment_id: '',
    booking_id: initialBookingId,
    property_id: '',
    refund_status: '',
    from_date: '',
    to_date: '',
  })

  const [detailsVisible, setDetailsVisible] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState(null)

  const totalPages = useMemo(() => {
    const pages = Math.ceil(Math.max(0, total) / Math.max(1, perPage))
    return Math.max(1, pages)
  }, [perPage, total])

  const fetchRefunds = useCallback(async () => {
    if ((filters.from_date && !filters.to_date) || (!filters.from_date && filters.to_date)) {
      setError('from_date and to_date must be selected together')
      return
    }

    setLoading(true)
    setError('')

    try {
      const query = buildQueryParams({ page, perPage, sortField, sortDir, filters })
      const res = await fetch(`${API_BASE}/refunds?${query}`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok || body?.success === false) {
        throw new Error(body?.message || 'Failed to fetch refunds')
      }

      const payload = body?.data || {}
      setRefunds(Array.isArray(payload.items) ? payload.items : [])
      setTotal(Number(payload.total || 0))
    } catch (err) {
      setRefunds([])
      setTotal(0)
      setError(err.message || 'Failed to fetch refunds')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, auth, filters, page, perPage, sortDir, sortField])

  useEffect(() => {
    fetchRefunds()
  }, [fetchRefunds])

  useEffect(() => {
    setFilters((prev) => {
      if (prev.booking_id === initialBookingId) return prev
      return { ...prev, booking_id: initialBookingId }
    })
    setPage(1)
  }, [initialBookingId])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const onFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({
      refund_id: '',
      payment_id: '',
      booking_id: '',
      property_id: '',
      refund_status: '',
      from_date: '',
      to_date: '',
    })
    setPage(1)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const openRefundDetails = async (refundId) => {
    setDetailsVisible(true)
    setDetailsLoading(true)
    setSelectedRefund(null)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/refunds/${refundId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body?.success === false) {
        throw new Error(body?.message || 'Failed to fetch refund details')
      }
      setSelectedRefund(body?.data || null)
    } catch (err) {
      setError(err.message || 'Failed to fetch refund details')
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Refunds</h4>
        <div className="d-flex align-items-center gap-2">
          <IconOnlyButton icon={cilMagnifyingGlass} label="Search Refunds" onClick={fetchRefunds} />
          <IconOnlyButton
            icon={cilReload}
            tone="info"
            label="Refresh Refunds"
            onClick={fetchRefunds}
          />
        </div>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CRow className="g-2 mb-3">
          <CCol md={3}>
            <CFormInput
              label="Refund ID"
              value={filters.refund_id}
              onChange={(e) => onFilterChange('refund_id', e.target.value)}
            />
          </CCol>
          <CCol md={3}>
            <CFormInput
              label="Payment ID"
              value={filters.payment_id}
              onChange={(e) => onFilterChange('payment_id', e.target.value)}
            />
          </CCol>
          <CCol md={3}>
            <CFormInput
              label="Booking ID"
              value={filters.booking_id}
              onChange={(e) => onFilterChange('booking_id', e.target.value)}
            />
          </CCol>
          <CCol md={3}>
            <CFormInput
              label="Property ID"
              value={filters.property_id}
              onChange={(e) => onFilterChange('property_id', e.target.value)}
            />
          </CCol>
        </CRow>

        <CRow className="g-2 mb-3">
          <CCol md={2}>
            <CFormSelect
              label="Refund Status"
              value={filters.refund_status}
              onChange={(e) => onFilterChange('refund_status', e.target.value)}
            >
              <option value="">All</option>
              {REFUND_STATUS_OPTIONS.filter(Boolean).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="date"
              label="From Date"
              value={filters.from_date}
              onChange={(e) => onFilterChange('from_date', e.target.value)}
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              type="date"
              label="To Date"
              value={filters.to_date}
              onChange={(e) => onFilterChange('to_date', e.target.value)}
            />
          </CCol>
          <CCol md={2}>
            <CFormSelect
              label="Per Page"
              value={String(perPage)}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setPage(1)
              }}
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={String(option)}>
                  {option}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={2} className="d-flex align-items-end">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </CCol>
        </CRow>

        {loading ? (
          <div className="text-center my-4">
            <CSpinner color="primary" />
          </div>
        ) : (
          <>
            <CTable bordered hover responsive className="align-middle text-nowrap">
              <CTableHead color="dark">
                <CTableRow>
                  <CTableHeaderCell onClick={() => handleSort('refund_id')}>
                    Refund ID {sortField === 'refund_id' && (sortDir === 'asc' ? '↑' : '↓')}
                  </CTableHeaderCell>
                  <CTableHeaderCell>Guest</CTableHeaderCell>
                  <CTableHeaderCell>Property</CTableHeaderCell>
                  <CTableHeaderCell>Booking</CTableHeaderCell>
                  <CTableHeaderCell>Stay Dates</CTableHeaderCell>
                  <CTableHeaderCell onClick={() => handleSort('refund_amount')}>
                    Amount {sortField === 'refund_amount' && (sortDir === 'asc' ? '↑' : '↓')}
                  </CTableHeaderCell>
                  <CTableHeaderCell>Mode</CTableHeaderCell>
                  <CTableHeaderCell onClick={() => handleSort('refund_status')}>
                    Status {sortField === 'refund_status' && (sortDir === 'asc' ? '↑' : '↓')}
                  </CTableHeaderCell>
                  <CTableHeaderCell>Reason</CTableHeaderCell>
                  <CTableHeaderCell onClick={() => handleSort('created_at')}>
                    Created {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                  </CTableHeaderCell>
                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {refunds.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={11} className="text-center">
                      No refunds found
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  refunds.map((item) => (
                    <CTableRow key={item.refund_id}>
                      <CTableDataCell>{item.refund_id}</CTableDataCell>
                      <CTableDataCell>{getGuestName(item)}</CTableDataCell>
                      <CTableDataCell>{getPropertyName(item)}</CTableDataCell>
                      <CTableDataCell>{getBookingCode(item)}</CTableDataCell>
                      <CTableDataCell>{getStayDates(item)}</CTableDataCell>
                      <CTableDataCell>
                        {formatCurrency(item.refund_amount, item.currency)}
                      </CTableDataCell>
                      <CTableDataCell>{item.refund_mode || '-'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={getStatusColor(item.refund_status)}>
                          {item.refund_status || '-'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{item.refund_reason || '-'}</CTableDataCell>
                      <CTableDataCell>{formatDateTime(item.created_at)}</CTableDataCell>
                      <CTableDataCell>
                        <IconOnlyButton
                          icon={cilMagnifyingGlass}
                          tone="info"
                          label="View Refund Details"
                          onClick={() => openRefundDetails(item.refund_id)}
                        />
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <IconOnlyButton
                icon={cilChevronLeft}
                label="Previous Page"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              />
              <span>
                Page {page} of {totalPages} | Total: {total}
              </span>
              <IconOnlyButton
                icon={cilChevronRight}
                label="Next Page"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              />
            </div>
          </>
        )}
      </CCardBody>

      <CModal visible={detailsVisible} size="lg" onClose={() => setDetailsVisible(false)}>
        <CModalHeader>Refund Details</CModalHeader>
        <CModalBody>
          {detailsLoading ? (
            <div className="text-center my-4">
              <CSpinner color="primary" />
            </div>
          ) : !selectedRefund ? (
            <CAlert color="warning">No refund details found</CAlert>
          ) : (
            <>
              <CRow className="g-3 mb-3">
                <CCol md={4}>
                  <strong>Refund ID:</strong> {selectedRefund.refund_id}
                </CCol>
                <CCol md={4}>
                  <strong>Guest:</strong> {getGuestName(selectedRefund)}
                </CCol>
                <CCol md={4}>
                  <strong>Property:</strong> {getPropertyName(selectedRefund)}
                </CCol>
                <CCol md={4}>
                  <strong>Booking:</strong> {getBookingCode(selectedRefund)}
                </CCol>
                <CCol md={4}>
                  <strong>Stay Dates:</strong> {getStayDates(selectedRefund)}
                </CCol>
                <CCol md={4}>
                  <strong>Amount:</strong>{' '}
                  {formatCurrency(selectedRefund.refund_amount, selectedRefund.currency)}
                </CCol>
                <CCol md={4}>
                  <strong>Currency:</strong> {selectedRefund.currency || 'INR'}
                </CCol>
                <CCol md={4}>
                  <strong>Mode:</strong> {selectedRefund.refund_mode || '-'}
                </CCol>
                <CCol md={4}>
                  <strong>Gateway:</strong> {selectedRefund.refund_gateway || '-'}
                </CCol>
                <CCol md={4}>
                  <strong>Transaction:</strong> {selectedRefund.refund_transaction_id || '-'}
                </CCol>
                <CCol md={4}>
                  <strong>Status:</strong>{' '}
                  <CBadge color={getStatusColor(selectedRefund.refund_status)}>
                    {selectedRefund.refund_status || '-'}
                  </CBadge>
                </CCol>
                <CCol md={12}>
                  <strong>Reason:</strong> {selectedRefund.refund_reason || '-'}
                </CCol>
                <CCol md={12}>
                  <strong>Failure Reason:</strong> {selectedRefund.failure_reason || '-'}
                </CCol>
                <CCol md={6}>
                  <strong>Processed:</strong> {formatDateTime(selectedRefund.processed_at)}
                </CCol>
                <CCol md={6}>
                  <strong>Created:</strong> {formatDateTime(selectedRefund.created_at)}
                </CCol>
              </CRow>

              <h6 className="mb-2">Source Payment</h6>
              <CTable bordered responsive className="mb-4">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Payment ID</CTableHeaderCell>
                    <CTableHeaderCell>Mode</CTableHeaderCell>
                    <CTableHeaderCell>Amount</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Transaction</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell>{selectedRefund?.payment?.payment_id || '-'}</CTableDataCell>
                    <CTableDataCell>{selectedRefund?.payment?.payment_mode || '-'}</CTableDataCell>
                    <CTableDataCell>
                      {formatCurrency(
                        selectedRefund?.payment?.amount || 0,
                        selectedRefund?.currency || 'INR',
                      )}
                    </CTableDataCell>
                    <CTableDataCell>{selectedRefund?.payment?.status || '-'}</CTableDataCell>
                    <CTableDataCell>
                      {selectedRefund?.payment?.transaction_id || '-'}
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>

              <h6 className="mb-2">Booking</h6>
              <CTable bordered responsive className="mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Booking Code</CTableHeaderCell>
                    <CTableHeaderCell>Property</CTableHeaderCell>
                    <CTableHeaderCell>Guest</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Checkin</CTableHeaderCell>
                    <CTableHeaderCell>Checkout</CTableHeaderCell>
                    <CTableHeaderCell>Total Amount</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell>{getBookingCode(selectedRefund)}</CTableDataCell>
                    <CTableDataCell>{getPropertyName(selectedRefund)}</CTableDataCell>
                    <CTableDataCell>{getGuestName(selectedRefund)}</CTableDataCell>
                    <CTableDataCell>
                      {selectedRefund?.booking?.booking_status || '-'}
                    </CTableDataCell>
                    <CTableDataCell>
                      {formatDate(selectedRefund?.booking?.checkin_date)}
                    </CTableDataCell>
                    <CTableDataCell>
                      {formatDate(selectedRefund?.booking?.checkout_date)}
                    </CTableDataCell>
                    <CTableDataCell>
                      {formatCurrency(
                        selectedRefund?.booking?.total_amount || 0,
                        selectedRefund?.currency || 'INR',
                      )}
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </>
          )}
        </CModalBody>
      </CModal>
    </CCard>
  )
}

export default RefundList
