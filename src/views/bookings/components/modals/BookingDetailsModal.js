import React from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
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
import { cilX } from '@coreui/icons'
import IconOnlyButton from '../../../../components/IconOnlyButton'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatusLabel,
  getBookingCode,
  getBookingId,
  getBookingNotes,
  getBookingSource,
  getBookingStatus,
  getCheckinDate,
  getCheckoutDate,
  getCreatedAuditAt,
  getGuestCount,
  getGuestName,
  getGuestPhone,
  getPaymentOutstanding,
  getPaymentStatus,
  getPaymentTotalAmount,
  getPaymentTotalPaid,
  getPropertyName,
  getRoomSummaryRows,
  getStatusColor,
  getStayNightsValue,
  getTaxAmount,
  getUpdatedAt,
  normalizeFileUrls,
  toNumber,
} from '../../bookingListUtils'

const BookingDetailsModal = ({
  visible,
  onClose,
  loading,
  error,
  booking,
  propertyMap,
  userMap,
  apiBase,
}) => {
  const detailsRoomRows = getRoomSummaryRows(booking || {})
  const detailsGuests = Array.isArray(booking?.guests) ? booking.guests : []
  const detailsDocuments = Array.isArray(booking?.documents) ? booking.documents : []
  const detailsPayments = Array.isArray(booking?.payments) ? booking.payments : []
  const detailsLocks = Array.isArray(booking?.locks) ? booking.locks : []
  const detailsStayNights = booking ? getStayNightsValue(booking) : 0
  const selectedAudit = booking?.audit || {}
  const rawInvoiceUrl =
    booking?.invoice_url ||
    booking?.invoice?.invoice_url ||
    booking?.invoice?.url ||
    booking?.invoice?.file_url ||
    booking?.invoice?.path ||
    ''

  const resolveInvoiceHref = (url) => {
    if (!url) return ''

    try {
      const base = apiBase || window.location.origin
      return new URL(url, base).toString()
    } catch (err) {
      return ''
    }
  }

  const invoiceHref = resolveInvoiceHref(rawInvoiceUrl)

  const handleInvoiceDownload = () => {
    if (!invoiceHref) return
    window.open(invoiceHref, '_blank', 'noopener')
  }

  const resolveAuditActorName = (nameCandidates = [], idCandidates = []) => {
    for (const candidate of nameCandidates) {
      const text = String(candidate || '').trim()
      if (text) return text
    }
    for (const candidate of idCandidates) {
      if (candidate === undefined || candidate === null || candidate === '') continue
      const mapped = userMap?.[String(candidate)]
      if (mapped) return mapped
    }
    return '-'
  }

  const createdByName = resolveAuditActorName(
    [
      selectedAudit?.created_by_name,
      selectedAudit?.created_by_user_name,
      selectedAudit?.created_by_full_name,
      selectedAudit?.created_by_user?.full_name,
      selectedAudit?.created_by_user?.name,
      booking?.created_by_name,
      booking?.created_by_user?.full_name,
      booking?.created_by_user?.name,
    ],
    [selectedAudit?.created_by, booking?.created_by],
  )

  const updatedByName = resolveAuditActorName(
    [
      selectedAudit?.updated_by_name,
      selectedAudit?.updated_by_user_name,
      selectedAudit?.updated_by_full_name,
      selectedAudit?.updated_by_user?.full_name,
      selectedAudit?.updated_by_user?.name,
      booking?.updated_by_name,
      booking?.updated_by_user?.full_name,
      booking?.updated_by_user?.name,
    ],
    [selectedAudit?.updated_by, booking?.updated_by],
  )

  const cancelledByName = resolveAuditActorName(
    [
      selectedAudit?.cancelled_by_name,
      selectedAudit?.cancelled_by_user_name,
      selectedAudit?.cancelled_by_full_name,
      selectedAudit?.cancelled_by_user?.full_name,
      selectedAudit?.cancelled_by_user?.name,
      booking?.cancelled_by_name,
      booking?.cancelled_by_user?.full_name,
      booking?.cancelled_by_user?.name,
    ],
    [
      selectedAudit?.cancelled_by,
      booking?.cancelled_by,
      getBookingStatus(booking) === 'cancelled'
        ? selectedAudit?.updated_by || booking?.updated_by
        : null,
    ],
  )

  return (
    <CModal size="lg" visible={visible} onClose={onClose}>
      <CModalHeader>Booking Details</CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="text-center py-3">
            <CSpinner color="primary" />
          </div>
        ) : !booking ? (
          <p>No booking selected.</p>
        ) : (
          <>
            {error && <CAlert color="warning">{error}</CAlert>}
            {!invoiceHref && (
              <CAlert color="info" className="mb-2">
                Invoice is not available for this booking.
              </CAlert>
            )}

            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <h5 className="mb-1">{getBookingCode(booking)}</h5>
                <div className="small text-medium-emphasis">
                  Booking ID: {getBookingId(booking) || '-'} | Source: {getBookingSource(booking)}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <CBadge color={getStatusColor(getBookingStatus(booking))}>
                  Booking: {formatStatusLabel(getBookingStatus(booking))}
                </CBadge>
                <CBadge color={getStatusColor(getPaymentStatus(booking))}>
                  Payment: {formatStatusLabel(getPaymentStatus(booking))}
                </CBadge>
              </div>
            </div>

            <CRow className="g-2 mb-3">
              <CCol md={3}>
                <div className="border rounded p-2 h-100">
                  <div className="small text-medium-emphasis">Check-in</div>
                  <div className="fw-semibold">{formatDate(getCheckinDate(booking))}</div>
                </div>
              </CCol>
              <CCol md={3}>
                <div className="border rounded p-2 h-100">
                  <div className="small text-medium-emphasis">Check-out</div>
                  <div className="fw-semibold">{formatDate(getCheckoutDate(booking))}</div>
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
                  <div className="fw-semibold">{getGuestCount(booking)}</div>
                </div>
              </CCol>
              <CCol md={3}>
                <div className="border rounded p-2 h-100">
                  <div className="small text-medium-emphasis">Total</div>
                  <div className="fw-semibold">
                    {formatCurrency(getPaymentTotalAmount(booking))}
                  </div>
                </div>
              </CCol>
              <CCol md={3}>
                <div className="border rounded p-2 h-100">
                  <div className="small text-medium-emphasis">Tax</div>
                  <div className="fw-semibold">{formatCurrency(getTaxAmount(booking))}</div>
                </div>
              </CCol>
              <CCol md={3}>
                <div className="border rounded p-2 h-100">
                  <div className="small text-medium-emphasis">Paid</div>
                  <div className="fw-semibold">
                    {formatCurrency(getPaymentTotalPaid(booking))}
                  </div>
                </div>
              </CCol>
              <CCol md={3}>
                <div className="border rounded p-2 h-100">
                  <div className="small text-medium-emphasis">Outstanding</div>
                  <div className="fw-semibold">
                    {formatCurrency(getPaymentOutstanding(booking))}
                  </div>
                </div>
              </CCol>
              <CCol md={3}>
                <div className="border rounded p-2 h-100">
                  <div className="small text-medium-emphasis">Updated</div>
                  <div className="fw-semibold">
                    {formatDateTime(getUpdatedAt(booking) || getCreatedAuditAt(booking))}
                  </div>
                </div>
              </CCol>
            </CRow>

            <CRow className="g-2 mb-3">
              <CCol md={4}>
                <div className="border rounded p-2 h-100">
                  <div className="fw-semibold mb-1">Lead Guest</div>
                  <div>
                    <strong>Name:</strong> {booking?.user?.full_name || getGuestName(booking)}
                  </div>
                  <div>
                    <strong>Phone:</strong> {booking?.user?.phone || getGuestPhone(booking)}
                  </div>
                  <div>
                    <strong>Email:</strong> {booking?.user?.email || '-'}
                  </div>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="border rounded p-2 h-100">
                  <div className="fw-semibold mb-1">Property</div>
                  <div>
                    <strong>Name:</strong> {getPropertyName(booking, propertyMap || {})}
                  </div>
                  <div>
                    <strong>Code:</strong> {booking?.property?.property_code || '-'}
                  </div>
                  <div>
                    <strong>Location:</strong>{' '}
                    {[booking?.property?.city, booking?.property?.state]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </div>
                  <div>
                    <strong>Address:</strong> {booking?.property?.address || '-'}
                  </div>
                </div>
              </CCol>
            </CRow>

            {getBookingNotes(booking) !== '-' && (
              <div className="border rounded p-2 mb-3">
                <div className="fw-semibold mb-1">Notes</div>
                <div>{getBookingNotes(booking)}</div>
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
                        <CTableDataCell>
                          {lock?.room_type?.room_type_name || lock?.room_type_id || '-'}
                        </CTableDataCell>
                        <CTableDataCell>{toNumber(lock?.units_locked, 0)}</CTableDataCell>
                        <CTableDataCell>{formatDateTime(lock?.locked_until)}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {booking?.audit && (
              <div className="border rounded p-2 small">
                <div className="fw-semibold mb-1">Audit</div>
                <div>
                  <strong>Created:</strong> {formatDateTime(selectedAudit.created_at)} |{' '}
                  <strong>Updated:</strong> {formatDateTime(selectedAudit.updated_at)}
                </div>
                <div>
                  <strong>Created By:</strong> {createdByName} |{' '}
                  <strong>Updated By:</strong> {updatedByName}
                </div>
                <div>
                  <strong>Cancelled By:</strong> {cancelledByName}
                </div>
                <div>
                  <strong>IP:</strong> {selectedAudit.ip_address || '-'}
                </div>
              </div>
            )}
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton
          color="primary"
          variant="outline"
          onClick={handleInvoiceDownload}
          disabled={!invoiceHref}
        >
          Download Invoice
        </CButton>
        <IconOnlyButton icon={cilX} tone="default" label="Close Details" onClick={onClose} />
      </CModalFooter>
    </CModal>
  )
}

export default React.memo(BookingDetailsModal)
