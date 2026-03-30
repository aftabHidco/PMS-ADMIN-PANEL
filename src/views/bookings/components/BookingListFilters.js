import React from 'react'
import {
  CCollapse,
  CCol,
  CFormInput,
  CFormSelect,
  CNav,
  CNavItem,
  CNavLink,
  CRow,
} from '@coreui/react'
import { cilReload } from '@coreui/icons'
import IconOnlyButton from '../../../components/IconOnlyButton'
import { formatStatusLabel } from '../bookingListUtils'

const BookingListFilters = ({
  activeListTab,
  onTabChange,
  bookingsCount,
  cancelledBookingsCount,
  showFilters,
  filters,
  properties,
  uniqueBookingStatuses,
  onFilterChange,
  onDateBlur,
  onReset,
}) => {
  return (
    <>
      <CNav variant="tabs" className="mb-3">
        <CNavItem>
          <CNavLink
            active={activeListTab === 'all'}
            onClick={() => {
              onTabChange('all')
            }}
          >
            All Bookings ({bookingsCount})
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            active={activeListTab === 'cancelled'}
            onClick={() => {
              onTabChange('cancelled')
            }}
          >
            Cancelled Bookings ({cancelledBookingsCount})
          </CNavLink>
        </CNavItem>
      </CNav>

      <CCollapse visible={showFilters}>
        <CRow className="g-2 mb-3 align-items-end">
          <CCol lg={2}>
            <CFormInput
              label="Search"
              placeholder="Booking, guest, phone..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </CCol>
          <CCol lg={2}>
            <CFormSelect
              label="Property"
              value={filters.property_id}
              onChange={(e) => onFilterChange('property_id', e.target.value)}
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
              value={activeListTab === 'cancelled' ? 'cancelled' : filters.booking_status}
              onChange={(e) => onFilterChange('booking_status', e.target.value)}
              disabled={activeListTab === 'cancelled'}
            >
              {activeListTab === 'cancelled' ? (
                <option value="cancelled">Cancelled</option>
              ) : (
                <>
                  <option value="">All</option>
                  {uniqueBookingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </>
              )}
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
              onChange={(e) => onFilterChange('checkin_from', e.target.value)}
              onBlur={(e) => onDateBlur('checkin_from', e.target.value)}
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
              onChange={(e) => onFilterChange('checkin_to', e.target.value)}
              onBlur={(e) => onDateBlur('checkin_to', e.target.value)}
            />
          </CCol>
          <CCol lg={2} className="d-flex justify-content-end">
            <IconOnlyButton
              icon={cilReload}
              tone="default"
              size="sm"
              onClick={onReset}
              label="Reset Filters"
            />
          </CCol>
        </CRow>
      </CCollapse>
    </>
  )
}

export default React.memo(BookingListFilters)
