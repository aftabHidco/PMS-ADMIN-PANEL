import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  CBadge,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import {
  cilCheckCircle,
  cilCloudUpload,
  cilMagnifyingGlass,
  cilReload,
  cilXCircle,
} from '@coreui/icons'
import IconOnlyButton from '../../../components/IconOnlyButton'
import {
  formatDate,
  formatStatusLabel,
  getBookingCode,
  getBookingId,
  getBookingStatus,
  getCheckinDate,
  getCheckoutDate,
  getPersonLabel,
  getPropertyName,
  getStatusColor,
  getStayNights,
} from '../bookingListUtils'

const BookingTableRow = React.memo(
  ({
    booking,
    index,
    safePage,
    perPage,
    showPropertyColumn,
    activeListTab,
    propertyMap,
    onViewDetails,
    onAccept,
    onUpload,
    onRefund,
    onCancel,
    isActionLoading,
  }) => {
    const bookingId = getBookingId(booking)
    const bookingStatus = getBookingStatus(booking)
    const stayNights = getStayNights(booking)
    const isCancelledTabView = activeListTab === 'cancelled'

    const showAcceptButton = !isCancelledTabView && bookingStatus === 'booked'
    const showUploadButton = !isCancelledTabView
    const showCancelButton = !isCancelledTabView && ['booked', 'accepted'].includes(bookingStatus)
    const showRefundButton = isCancelledTabView

    return (
      <CTableRow key={bookingId || `${index}-${getBookingCode(booking)}`}>
        <CTableDataCell>{(safePage - 1) * perPage + index + 1}</CTableDataCell>
        <CTableDataCell style={{ maxWidth: '160px' }}>
          <span
            className="d-inline-block text-truncate align-middle"
            style={{ maxWidth: '145px' }}
            title={getBookingCode(booking)}
          >
            {getBookingCode(booking)}
          </span>
        </CTableDataCell>
        <CTableDataCell>{getPersonLabel(booking)}</CTableDataCell>
        {showPropertyColumn && (
          <CTableDataCell>{getPropertyName(booking, propertyMap)}</CTableDataCell>
        )}
        <CTableDataCell>
          {formatDate(getCheckinDate(booking))} - {formatDate(getCheckoutDate(booking))}
          {stayNights !== null ? ` (${stayNights}N)` : ''}
        </CTableDataCell>
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
              onClick={() => onViewDetails(booking)}
              label="View Details"
            />

            {showAcceptButton && (
              <IconOnlyButton
                tone="success"
                size="sm"
                disabled={
                  isActionLoading(bookingId, 'accept') ||
                  isActionLoading(bookingId, 'cancel') ||
                  isActionLoading(bookingId, 'upload')
                }
                onClick={() => onAccept(booking)}
                label="Accept"
              >
                {isActionLoading(bookingId, 'accept') ? (
                  <CSpinner size="sm" />
                ) : (
                  <CIcon icon={cilCheckCircle} />
                )}
              </IconOnlyButton>
            )}

            {showUploadButton && (
              <IconOnlyButton
                icon={cilCloudUpload}
                tone="primary"
                size="sm"
                disabled={
                  isActionLoading(bookingId, 'accept') ||
                  isActionLoading(bookingId, 'cancel') ||
                  isActionLoading(bookingId, 'upload')
                }
                onClick={() => onUpload(booking)}
                label="Upload Document"
              />
            )}

            {showRefundButton && (
              <IconOnlyButton
                icon={cilReload}
                tone="warning"
                size="sm"
                disabled={
                  isActionLoading(bookingId, 'refund') ||
                  isActionLoading(bookingId, 'accept') ||
                  isActionLoading(bookingId, 'cancel') ||
                  isActionLoading(bookingId, 'upload')
                }
                onClick={() => onRefund(booking)}
                label="Refund Booking"
              >
                {isActionLoading(bookingId, 'refund') ? (
                  <CSpinner size="sm" />
                ) : (
                  <CIcon icon={cilReload} />
                )}
              </IconOnlyButton>
            )}

            {showCancelButton && (
              <IconOnlyButton
                tone="danger"
                size="sm"
                disabled={
                  isActionLoading(bookingId, 'accept') ||
                  isActionLoading(bookingId, 'cancel') ||
                  isActionLoading(bookingId, 'upload')
                }
                onClick={() => onCancel(booking)}
                label="Cancel Booking"
              >
                {isActionLoading(bookingId, 'cancel') ? (
                  <CSpinner size="sm" />
                ) : (
                  <CIcon icon={cilXCircle} />
                )}
              </IconOnlyButton>
            )}
          </div>
        </CTableDataCell>
      </CTableRow>
    )
  },
)

const BookingTable = ({
  bookings,
  safePage,
  perPage,
  showPropertyColumn,
  sortField,
  sortDir,
  onSort,
  activeListTab,
  propertyMap,
  onViewDetails,
  onAccept,
  onUpload,
  onRefund,
  onCancel,
  isActionLoading,
}) => {
  const tableColSpan = showPropertyColumn ? 8 : 7

  return (
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
          <CTableHeaderCell onClick={() => onSort('booking_code')} style={{ width: '160px' }}>
            Booking {sortField === 'booking_code' && (sortDir === 'asc' ? '↑' : '↓')}
          </CTableHeaderCell>
          <CTableHeaderCell onClick={() => onSort('guest_name')}>
            No. of Person {sortField === 'guest_name' && (sortDir === 'asc' ? '↑' : '↓')}
          </CTableHeaderCell>
          {showPropertyColumn && (
            <CTableHeaderCell onClick={() => onSort('property_name')}>
              Property {sortField === 'property_name' && (sortDir === 'asc' ? '↑' : '↓')}
            </CTableHeaderCell>
          )}
          <CTableHeaderCell onClick={() => onSort('checkin_date')}>
            Stay Dates {sortField === 'checkin_date' && (sortDir === 'asc' ? '↑' : '↓')}
          </CTableHeaderCell>
          <CTableHeaderCell onClick={() => onSort('booking_status')}>
            Booking Status {sortField === 'booking_status' && (sortDir === 'asc' ? '↑' : '↓')}
          </CTableHeaderCell>
          <CTableHeaderCell>Actions</CTableHeaderCell>
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {bookings.length === 0 ? (
          <CTableRow>
            <CTableDataCell colSpan={tableColSpan} className="text-center">
              No bookings found
            </CTableDataCell>
          </CTableRow>
        ) : (
          bookings.map((booking, index) => (
            <BookingTableRow
              key={getBookingId(booking) || `${index}-${getBookingCode(booking)}`}
              booking={booking}
              index={index}
              safePage={safePage}
              perPage={perPage}
              showPropertyColumn={showPropertyColumn}
              activeListTab={activeListTab}
              propertyMap={propertyMap}
              onViewDetails={onViewDetails}
              onAccept={onAccept}
              onUpload={onUpload}
              onRefund={onRefund}
              onCancel={onCancel}
              isActionLoading={isActionLoading}
            />
          ))
        )}
      </CTableBody>
    </CTable>
  )
}

export default React.memo(BookingTable)
