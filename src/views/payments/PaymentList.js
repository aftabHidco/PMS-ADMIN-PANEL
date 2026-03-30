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
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const PER_PAGE_OPTIONS = [10, 25, 50, 100]
const STATUS_OPTIONS = ['', 'pending', 'success', 'failed', 'paid', 'partial_refunded', 'refunded']
const MODE_OPTIONS = ['', 'cash', 'pos', 'upi', 'card', 'gateway']

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
  if (normalized === 'success' || normalized === 'paid') return 'success'
  if (normalized === 'pending') return 'warning'
  if (normalized === 'partial_refunded') return 'info'
  if (normalized === 'refunded') return 'secondary'
  return 'danger'
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

const PaymentList = () => {
  const auth = useAuth()
  const API_BASE = auth.API_BASE

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payments, setPayments] = useState([])
  const [properties, setProperties] = useState([])
  const [total, setTotal] = useState(0)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  const [filters, setFilters] = useState({
    booking_code: '',
    property_id: '',
    user_name: '',
    status: '',
    payment_mode: '',
    from_date: '',
    to_date: '',
    search: '',
  })

  const [detailsVisible, setDetailsVisible] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)

  const totalPages = useMemo(() => {
    const pages = Math.ceil(Math.max(0, total) / Math.max(1, perPage))
    return Math.max(1, pages)
  }, [perPage, total])

  const fetchPayments = useCallback(async () => {
    if ((filters.from_date && !filters.to_date) || (!filters.from_date && filters.to_date)) {
      setError('from_date and to_date must be selected together')
      return
    }

    setLoading(true)
    setError('')

    try {
      const query = buildQueryParams({ page, perPage, sortField, sortDir, filters })
      const res = await fetch(`${API_BASE}/payments?${query}`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok || body?.success === false) {
        throw new Error(body?.message || 'Failed to fetch payments')
      }

      const payload = body?.data || {}
      setPayments(Array.isArray(payload.items) ? payload.items : [])
      setTotal(Number(payload.total || 0))
    } catch (err) {
      setPayments([])
      setTotal(0)
      setError(err.message || 'Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, auth, filters, page, perPage, sortDir, sortField])

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/properties?_perPage=500`, {
        headers: {
          ...auth.getAuthHeader(),
        },
      })
      const body = await res.json().catch(() => ({}))

      const payload = body?.data
      const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : Array.isArray(body?.items)
            ? body.items
            : Array.isArray(body)
              ? body
              : []

      setProperties(items)
    } catch (err) {
      setProperties([])
    }
  }, [API_BASE, auth])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

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
      booking_code: '',
      property_id: '',
      user_name: '',
      status: '',
      payment_mode: '',
      from_date: '',
      to_date: '',
      search: '',
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

  const openPaymentDetails = async (paymentId) => {
    setDetailsVisible(true)
    setDetailsLoading(true)
    setSelectedPayment(null)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body?.success === false) {
        throw new Error(body?.message || 'Failed to fetch payment details')
      }
      setSelectedPayment(body?.data || null)
    } catch (err) {
      setError(err.message || 'Failed to fetch payment details')
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Payments</h4>
        <div className="d-flex align-items-center gap-2">
          <IconOnlyButton
            icon={cilMagnifyingGlass}
            label="Search Payments"
            onClick={fetchPayments}
          />
          <IconOnlyButton
            icon={cilReload}
            tone="info"
            label="Refresh Payments"
            onClick={fetchPayments}
          />
        </div>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CRow className="g-2 mb-3">
          <CCol md={3}>
            <CFormInput
              label="Search"
              placeholder="transaction/provider/gateway"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </CCol>
          <CCol md={2}>
            <CFormInput
              label="Booking Code"
              value={filters.booking_code}
              onChange={(e) => onFilterChange('booking_code', e.target.value)}
            />
          </CCol>
          <CCol md={2}>
            <CFormSelect
              label="Property"
              value={filters.property_id}
              onChange={(e) => onFilterChange('property_id', e.target.value)}
            >
              <option value="">All</option>
              {properties.map((property) => {
                const id = property?.property_id || property?.id
                const name = property?.property_name || property?.name || ''
                if (!id || !name) return null
                return (
                  <option key={id} value={String(id)}>
                    {name}
                  </option>
                )
              })}
            </CFormSelect>
          </CCol>
          <CCol md={3}>
            <CFormInput
              label="User Name"
              value={filters.user_name}
              onChange={(e) => onFilterChange('user_name', e.target.value)}
            />
          </CCol>
        </CRow>

        <CRow className="g-2 mb-3">
          <CCol md={2}>
            <CFormSelect
              label="Status"
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.filter(Boolean).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={2}>
            <CFormSelect
              label="Payment Mode"
              value={filters.payment_mode}
              onChange={(e) => onFilterChange('payment_mode', e.target.value)}
            >
              <option value="">All</option>
              {MODE_OPTIONS.filter(Boolean).map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
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
                  <CTableHeaderCell>Booking Code</CTableHeaderCell>
                  <CTableHeaderCell>Property</CTableHeaderCell>
                  <CTableHeaderCell>User</CTableHeaderCell>
                  <CTableHeaderCell onClick={() => handleSort('payment_mode')}>
                    Mode {sortField === 'payment_mode' && (sortDir === 'asc' ? '↑' : '↓')}
                  </CTableHeaderCell>
                  <CTableHeaderCell onClick={() => handleSort('amount')}>
                    Amount {sortField === 'amount' && (sortDir === 'asc' ? '↑' : '↓')}
                  </CTableHeaderCell>
                  <CTableHeaderCell>Tax</CTableHeaderCell>
                  <CTableHeaderCell onClick={() => handleSort('status')}>
                    Status {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                  </CTableHeaderCell>
                  <CTableHeaderCell onClick={() => handleSort('created_at')}>
                    Created {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                  </CTableHeaderCell>
                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {payments.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center">
                      No payments found
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  payments.map((item, idx) => {
                    const currency = item?.currency || 'INR'
                    const paymentId = item?.payment_id
                    const rowKey =
                      paymentId ||
                      item?.transaction_id ||
                      item?.booking?.booking_code ||
                      item?.created_at ||
                      idx

                    return (
                      <CTableRow key={rowKey}>
                        <CTableDataCell>{item?.booking?.booking_code || '-'}</CTableDataCell>
                        <CTableDataCell>{item?.booking?.property_name || '-'}</CTableDataCell>
                        <CTableDataCell>{item?.booking?.user_name || '-'}</CTableDataCell>
                        <CTableDataCell>{item.payment_mode || '-'}</CTableDataCell>
                        <CTableDataCell>{formatCurrency(item.amount, currency)}</CTableDataCell>
                        <CTableDataCell>{formatCurrency(item.tax_amount, currency)}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={getStatusColor(item.status)}>{item.status || '-'}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{formatDateTime(item.created_at)}</CTableDataCell>
                        <CTableDataCell>
                          {paymentId ? (
                            <IconOnlyButton
                              icon={cilMagnifyingGlass}
                              tone="info"
                              label="View Payment Details"
                              onClick={() => openPaymentDetails(paymentId)}
                            />
                          ) : (
                            '-'
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
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
        <CModalHeader>Payment Details</CModalHeader>
        <CModalBody>
          {detailsLoading ? (
            <div className="text-center my-4">
              <CSpinner color="primary" />
            </div>
          ) : !selectedPayment ? (
            <CAlert color="warning">No payment details found</CAlert>
          ) : (
            <>
              <CRow className="g-3 mb-3">
                <CCol md={3}>
                  <strong>Booking Code:</strong> {selectedPayment?.booking?.booking_code || '-'}
                </CCol>
                <CCol md={3}>
                  <strong>Property:</strong> {selectedPayment?.booking?.property_name || '-'}
                </CCol>
                <CCol md={3}>
                  <strong>User:</strong> {selectedPayment?.booking?.user_name || '-'}
                </CCol>
                <CCol md={3}>
                  <strong>Mode:</strong> {selectedPayment.payment_mode || '-'}
                </CCol>
                <CCol md={3}>
                  <strong>Status:</strong>{' '}
                  <CBadge color={getStatusColor(selectedPayment.status)}>
                    {selectedPayment.status || '-'}
                  </CBadge>
                </CCol>
                <CCol md={3}>
                  <strong>Amount:</strong>{' '}
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </CCol>
                <CCol md={3}>
                  <strong>Tax Amount:</strong>{' '}
                  {formatCurrency(selectedPayment.tax_amount, selectedPayment.currency)}
                </CCol>
                <CCol md={3}>
                  <strong>Transaction:</strong> {selectedPayment.transaction_id || '-'}
                </CCol>
                <CCol md={3}>
                  <strong>Provider:</strong> {selectedPayment.provider || '-'}
                </CCol>
                <CCol md={3}>
                  <strong>Paid By:</strong>{' '}
                  {selectedPayment?.paid_by_name || selectedPayment?.booking?.user_name || '-'}
                </CCol>
                <CCol md={3}>
                  <strong>Paid By Role:</strong> {selectedPayment.paid_by_role || '-'}
                </CCol>
                <CCol md={3}>
                  <strong>Created:</strong> {formatDateTime(selectedPayment.created_at)}
                </CCol>
                <CCol md={3}>
                  <strong>Updated:</strong> {formatDateTime(selectedPayment.updated_at)}
                </CCol>
              </CRow>

              <h6 className="mb-2">Booking</h6>
              <CTable bordered responsive className="mb-4">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Booking Code</CTableHeaderCell>
                    <CTableHeaderCell>Property</CTableHeaderCell>
                    <CTableHeaderCell>User</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Checkin</CTableHeaderCell>
                    <CTableHeaderCell>Checkout</CTableHeaderCell>
                    <CTableHeaderCell>Total Amount</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell>{selectedPayment?.booking?.booking_code || '-'}</CTableDataCell>
                    <CTableDataCell>
                      {selectedPayment?.booking?.property_name || '-'}
                    </CTableDataCell>
                    <CTableDataCell>{selectedPayment?.booking?.user_name || '-'}</CTableDataCell>
                    <CTableDataCell>
                      {selectedPayment?.booking?.booking_status || '-'}
                    </CTableDataCell>
                    <CTableDataCell>{selectedPayment?.booking?.checkin_date || '-'}</CTableDataCell>
                    <CTableDataCell>
                      {selectedPayment?.booking?.checkout_date || '-'}
                    </CTableDataCell>
                    <CTableDataCell>
                      {formatCurrency(
                        selectedPayment?.booking?.total_amount || 0,
                        selectedPayment?.currency || 'INR',
                      )}
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>

              <h6 className="mb-2">Refunds</h6>
              <CTable bordered responsive>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Refund ID</CTableHeaderCell>
                    <CTableHeaderCell>Amount</CTableHeaderCell>
                    <CTableHeaderCell>Mode</CTableHeaderCell>
                    <CTableHeaderCell>Gateway</CTableHeaderCell>
                    <CTableHeaderCell>Transaction</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Reason</CTableHeaderCell>
                    <CTableHeaderCell>Created</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {!Array.isArray(selectedPayment.refunds) ||
                  selectedPayment.refunds.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center">
                        No refunds found
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    selectedPayment.refunds.map((refund) => (
                      <CTableRow key={refund.refund_id}>
                        <CTableDataCell>{refund.refund_id}</CTableDataCell>
                        <CTableDataCell>
                          {formatCurrency(refund.refund_amount, refund.currency)}
                        </CTableDataCell>
                        <CTableDataCell>{refund.refund_mode || '-'}</CTableDataCell>
                        <CTableDataCell>{refund.refund_gateway || '-'}</CTableDataCell>
                        <CTableDataCell>{refund.refund_transaction_id || '-'}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={getStatusColor(refund.refund_status)}>
                            {refund.refund_status || '-'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{refund.refund_reason || '-'}</CTableDataCell>
                        <CTableDataCell>{formatDateTime(refund.created_at)}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </>
          )}
        </CModalBody>
      </CModal>
    </CCard>
  )
}

export default PaymentList
