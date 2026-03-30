import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  CAlert,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CSpinner,
} from '@coreui/react'
import { cilBan, cilX } from '@coreui/icons'
import IconOnlyButton from '../../../../components/IconOnlyButton'
import {
  formatDate,
  formatDateTime,
  getBookingCode,
  getBookingId,
  getCheckinDate,
  getCheckoutDate,
  getCreatedAt,
  getGuestName,
  getPropertyName,
  getStayNights,
} from '../../bookingListUtils'

const BookingCancelModal = ({
  visible,
  onClose,
  booking,
  cancelReason,
  onCancelReasonChange,
  cancelReasonError,
  cancellationPolicies,
  onSubmit,
  isActionLoading,
  propertyMap,
}) => {
  const bookingId = getBookingId(booking)
  const cancelStayNights = booking ? getStayNights(booking) : null
  const cancelStayText = booking
    ? `${formatDate(getCheckinDate(booking))} - ${formatDate(getCheckoutDate(booking))}${
        cancelStayNights !== null ? ` (${cancelStayNights}N)` : ''
      }`
    : '-'

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>Cancel Booking</CModalHeader>
      <CModalBody>
        <p className="mb-1">
          Booking: <strong>{booking ? getBookingCode(booking) : '-'}</strong>
        </p>
        <p className="mb-1">
          User Name: <strong>{booking ? getGuestName(booking) : '-'}</strong>
        </p>
        <p className="mb-2">
          Property Name: <strong>{booking ? getPropertyName(booking, propertyMap || {}) : '-'}</strong>
        </p>
        <p className="mb-1">
          Booking Date:{' '}
          <strong>{booking ? formatDateTime(getCreatedAt(booking)) : '-'}</strong>
        </p>
        <p className="mb-2">
          Date of Stay: <strong>{cancelStayText}</strong>
        </p>
        {cancelReasonError && (
          <CAlert color="warning" className="mb-2">
            {cancelReasonError}
          </CAlert>
        )}
        {cancellationPolicies.length === 0 && (
          <CAlert color="warning" className="mb-2">
            No cancellation policy found. Please create one before cancelling bookings.
          </CAlert>
        )}
        <CFormTextarea
          label="Cancellation Reason (Optional)"
          rows={3}
          placeholder="Enter cancellation reason"
          value={cancelReason}
          onChange={(e) => onCancelReasonChange(e.target.value)}
        />
      </CModalBody>
      <CModalFooter>
        <IconOnlyButton icon={cilX} tone="default" label="Close Cancel Modal" onClick={onClose} />
        <IconOnlyButton
          tone="danger"
          onClick={onSubmit}
          disabled={
            !booking ||
            cancellationPolicies.length === 0 ||
            isActionLoading(bookingId, 'cancel') ||
            isActionLoading(bookingId, 'accept') ||
            isActionLoading(bookingId, 'upload')
          }
          label="Confirm Cancel Booking"
        >
          {booking && isActionLoading(bookingId, 'cancel') ? (
            <CSpinner size="sm" />
          ) : (
            <CIcon icon={cilBan} />
          )}
        </IconOnlyButton>
      </CModalFooter>
    </CModal>
  )
}

export default React.memo(BookingCancelModal)
