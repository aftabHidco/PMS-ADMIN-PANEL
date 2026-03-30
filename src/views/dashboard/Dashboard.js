import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBed,
  cilBuilding,
  cilCheckCircle,
  cilHome,
  cilMoney,
  cilPeople,
  cilReload,
  cilWallet,
  cilWarning,
} from '@coreui/icons'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormSelect,
  CListGroup,
  CListGroupItem,
  CProgress,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { CChartDoughnut, CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'
import {
  formatDate,
  formatDateTime,
  getBookingCode,
  getBookingStatus,
  getCheckinDate,
  getCheckoutDate,
  getCreatedAt,
  getGrandTotal,
  getGuestName,
  getPropertyId,
  getPropertyName,
  getStatusColor,
  normalizeStatus,
  toDateOnly,
  toNumber,
} from '../bookings/bookingListUtils'

const DASHBOARD_CARD_TONES = {
  primary: { accent: '#5856d6', soft: 'rgba(88, 86, 214, 0.12)' },
  info: { accent: '#3399ff', soft: 'rgba(51, 153, 255, 0.12)' },
  success: { accent: '#2eb85c', soft: 'rgba(46, 184, 92, 0.12)' },
  warning: { accent: '#f9b115', soft: 'rgba(249, 177, 21, 0.18)' },
  danger: { accent: '#e55353', soft: 'rgba(229, 83, 83, 0.12)' },
}

const NON_LIVE_BOOKING_STATUSES = new Set(['cancelled', 'canceled', 'expired', 'rejected', 'failed'])
const PAID_PAYMENT_STATUSES = new Set(['success', 'paid', 'partial_refunded', 'refunded'])
const SUCCESSFUL_REFUND_STATUSES = new Set(['success', 'processed', 'completed'])

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.bookings)) return payload.bookings
  return []
}

const normalizeDateOnly = (value) => {
  const text = String(value || '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : ''
}

const toISODate = (value) => {
  const date = toDateOnly(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createDayWindow = (days) => {
  const start = toDateOnly(new Date())
  if (!start) return []

  return Array.from({ length: days }, (_, index) => {
    const current = new Date(start)
    current.setDate(start.getDate() + index)

    return {
      date: current,
      iso: toISODate(current),
      label: current.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
      dayLabel: current.toLocaleDateString('en-IN', {
        weekday: 'short',
      }),
    }
  })
}

const formatCurrency = (value, currency = 'INR') => {
  const amount = toNumber(value, 0)
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    return `${amount.toFixed(2)} ${currency || 'INR'}`
  }
}

const formatPercent = (value) => `${toNumber(value, 0).toFixed(1)}%`

const getPaymentStatus = (payment) => normalizeStatus(payment?.status || payment?.payment_status)

const getRefundStatus = (refund) => normalizeStatus(refund?.refund_status || refund?.status)

const getRelatedPropertyId = (item) =>
  String(
    item?.property_id ||
      item?.property?.property_id ||
      item?.booking?.property_id ||
      item?.booking?.property?.property_id ||
      '',
  )

const getRoomTypeCapacity = (roomType) => {
  const roomQty = toNumber(roomType?.room_qty ?? roomType?.qty, 0)
  if (roomQty > 0) return roomQty

  const inventoryRows = Array.isArray(roomType?.inventory) ? roomType.inventory : []
  return inventoryRows.reduce((max, row) => Math.max(max, toNumber(row?.total_units, 0)), 0)
}

const getInventoryRowForDay = (roomType, dayIso) => {
  const rows = Array.isArray(roomType?.inventory) ? roomType.inventory : []
  return rows.find((row) => normalizeDateOnly(row?.inventory_date) === dayIso) || null
}

const getTotalUnitsForDay = (roomType, dayIso) => {
  const inventoryRow = getInventoryRowForDay(roomType, dayIso)
  const totalUnits = toNumber(inventoryRow?.total_units, 0)
  if (totalUnits > 0) return totalUnits
  return getRoomTypeCapacity(roomType)
}

const getAvailableUnitsForDay = (roomType, dayIso) => {
  const inventoryRow = getInventoryRowForDay(roomType, dayIso)
  if (inventoryRow && inventoryRow?.available_units !== undefined && inventoryRow?.available_units !== null) {
    const totalUnits = getTotalUnitsForDay(roomType, dayIso)
    const availableUnits = toNumber(inventoryRow.available_units, totalUnits)
    return Math.max(0, Math.min(totalUnits, availableUnits))
  }
  return getTotalUnitsForDay(roomType, dayIso)
}

const summarizeInventoryForDay = (properties, dayIso) => {
  return (Array.isArray(properties) ? properties : []).reduce(
    (summary, property) => {
      ;(property?.room_types || []).forEach((roomType) => {
        const totalUnits = getTotalUnitsForDay(roomType, dayIso)
        const availableUnits = getAvailableUnitsForDay(roomType, dayIso)
        summary.totalUnits += totalUnits
        summary.availableUnits += availableUnits
        summary.bookedUnits += Math.max(0, totalUnits - availableUnits)
      })
      return summary
    },
    { totalUnits: 0, availableUnits: 0, bookedUnits: 0 },
  )
}

const normalizeRoomType = (item) => {
  const roomTypeId = Number(item?.room_type_id || item?.id || 0)
  if (!roomTypeId) return null

  const inventory = Array.isArray(item?.inventory)
    ? item.inventory
        .map((row) => {
          const inventoryDate = normalizeDateOnly(row?.inventory_date)
          if (!inventoryDate) return null

          return {
            inventory_id: Number(row?.inventory_id || 0) || null,
            inventory_date: inventoryDate,
            total_units: toNumber(row?.total_units, 0),
            available_units: toNumber(row?.available_units, 0),
          }
        })
        .filter(Boolean)
    : []

  return {
    room_type_id: roomTypeId,
    room_type_name: item?.room_type_name || item?.name || `Room Type ${roomTypeId}`,
    room_qty: toNumber(item?.room_qty ?? item?.qty, 0),
    base_occupancy: toNumber(item?.base_occupancy, 0),
    max_occupancy: toNumber(item?.max_occupancy, 0),
    inventory,
  }
}

const buildInventoryProperties = (items, propertyNameMap) => {
  const propertyMap = new Map()

  ;(Array.isArray(items) ? items : []).forEach((item) => {
    const propertyId = Number(item?.property_id || item?.property?.property_id || 0)
    if (!propertyId) return

    if (!propertyMap.has(propertyId)) {
      propertyMap.set(propertyId, {
        property_id: propertyId,
        property_name:
          item?.property_name ||
          item?.property?.property_name ||
          propertyNameMap[propertyId] ||
          `Property ${propertyId}`,
        property_code: item?.property_code || item?.property?.property_code || '',
        room_types: [],
      })
    }

    const target = propertyMap.get(propertyId)
    const sourceRoomTypes = Array.isArray(item?.room_types)
      ? item.room_types
      : item?.room_type_id
        ? [item]
        : []

    const roomTypeMap = new Map((target.room_types || []).map((roomType) => [roomType.room_type_id, roomType]))

    sourceRoomTypes.forEach((roomType) => {
      const normalizedRoomType = normalizeRoomType(roomType)
      if (!normalizedRoomType) return
      roomTypeMap.set(normalizedRoomType.room_type_id, normalizedRoomType)
    })

    target.room_types = Array.from(roomTypeMap.values()).sort((left, right) => {
      return left.room_type_name.localeCompare(right.room_type_name)
    })
  })

  return Array.from(propertyMap.values()).sort((left, right) => left.property_id - right.property_id)
}

const isLiveBooking = (booking) => !NON_LIVE_BOOKING_STATUSES.has(getBookingStatus(booking))

const safePolicyRuleLabel = (policy) => {
  const rules = policy?.rules

  if (rules && typeof rules === 'object' && !Array.isArray(rules)) {
    const refundWindowDays = toNumber(rules?.refund_window_days, -1)
    const statusList = Array.isArray(rules?.applies_on_booking_status)
      ? rules.applies_on_booking_status.filter(Boolean).join(', ')
      : ''

    if (refundWindowDays >= 0 && statusList) {
      return `${refundWindowDays}-day refund window, applies on ${statusList}`
    }

    if (refundWindowDays >= 0) {
      return `${refundWindowDays}-day refund window`
    }

    if (statusList) {
      return `Applies on ${statusList}`
    }
  }

  if (typeof rules === 'string' && rules.trim()) return rules.trim()
  if (policy?.description) return policy.description
  return 'Policy configured'
}

const MetricCard = ({ title, value, subtitle, icon, tone = 'primary', progressValue }) => {
  const palette = DASHBOARD_CARD_TONES[tone] || DASHBOARD_CARD_TONES.primary

  return (
    <CCard className="h-100 border-0 shadow-sm">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div className="text-body-secondary text-uppercase small fw-semibold">{title}</div>
            <div className="fs-3 fw-semibold mt-2">{value}</div>
            <div className="small text-body-secondary mt-2">{subtitle}</div>
          </div>
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3"
            style={{
              width: 44,
              height: 44,
              backgroundColor: palette.soft,
              color: palette.accent,
              flexShrink: 0,
            }}
          >
            <CIcon icon={icon} size="lg" />
          </div>
        </div>
        {progressValue !== undefined ? (
          <CProgress className="mt-3" height={6} color={tone} value={Math.max(0, Math.min(100, progressValue))} />
        ) : null}
      </CCardBody>
    </CCard>
  )
}

const Dashboard = () => {
  const auth = useAuth()
  const API_BASE = auth.API_BASE
  const normalizedRole = normalizeStatus(auth?.user?.role || auth?.user?.Role?.role_name)
  const adminPropertyId = String(auth?.user?.property_id || '')
  const isAdminScoped = normalizedRole === 'admin' && adminPropertyId

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [issues, setIssues] = useState([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState('')
  const [dashboardData, setDashboardData] = useState({
    properties: [],
    inventoryProperties: [],
    bookings: [],
    payments: [],
    refunds: [],
    cancellationPolicies: [],
  })

  const dayWindow = useMemo(() => createDayWindow(7), [])
  const todayIso = dayWindow[0]?.iso || toISODate(new Date())

  const fetchJson = useCallback(
    async (path) => {
      const response = await fetch(`${API_BASE}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })

      const body = await response.json().catch(() => null)
      if (!response.ok || body?.success === false) {
        throw new Error(body?.message || `Failed to fetch ${path}`)
      }
      return body
    },
    [API_BASE, auth],
  )

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    const requests = [
      { key: 'properties', label: 'Properties', path: '/properties?_perPage=500' },
      { key: 'inventory', label: 'Room inventory', path: '/room-inventory/room-types' },
      { key: 'bookings', label: 'Bookings', path: '/bookings?_page=1&_perPage=500' },
      { key: 'payments', label: 'Payments', path: '/payments?_page=1&_perPage=500' },
      { key: 'refunds', label: 'Refunds', path: '/refunds?_page=1&_perPage=500' },
      {
        key: 'cancellationPolicies',
        label: 'Cancellation policies',
        path: '/cancellation-policies?_page=1&_perPage=100',
      },
    ]

    try {
      const results = await Promise.allSettled(requests.map((request) => fetchJson(request.path)))
      const nextIssues = []

      const nextProperties = []
      const nextBookings = []
      const nextPayments = []
      const nextRefunds = []
      const nextPolicies = []
      let rawInventoryPayload = []

      results.forEach((result, index) => {
        const request = requests[index]
        if (result.status !== 'fulfilled') {
          nextIssues.push(`${request.label} unavailable`)
          return
        }

        const payload = result.value
        if (request.key === 'properties') nextProperties.push(...extractItems(payload))
        if (request.key === 'inventory') rawInventoryPayload = extractItems(payload)
        if (request.key === 'bookings') nextBookings.push(...extractItems(payload))
        if (request.key === 'payments') nextPayments.push(...extractItems(payload))
        if (request.key === 'refunds') nextRefunds.push(...extractItems(payload))
        if (request.key === 'cancellationPolicies') nextPolicies.push(...extractItems(payload))
      })

      const propertyNameMap = nextProperties.reduce((map, property) => {
        const propertyId = Number(property?.property_id || property?.id || 0)
        if (!propertyId) return map
        map[propertyId] = property?.property_name || property?.name || `Property ${propertyId}`
        return map
      }, {})

      setDashboardData({
        properties: nextProperties,
        inventoryProperties: buildInventoryProperties(rawInventoryPayload, propertyNameMap),
        bookings: nextBookings,
        payments: nextPayments,
        refunds: nextRefunds,
        cancellationPolicies: nextPolicies,
      })
      setIssues(nextIssues)
      setLastUpdatedAt(new Date().toISOString())

      if (
        nextProperties.length === 0 &&
        nextBookings.length === 0 &&
        nextPayments.length === 0 &&
        nextRefunds.length === 0 &&
        rawInventoryPayload.length === 0 &&
        nextPolicies.length === 0
      ) {
        setError('No dashboard data could be loaded from the current PMS endpoints.')
      }
    } catch (loadError) {
      setError(loadError.message || 'Failed to load dashboard')
      setIssues([])
      setDashboardData({
        properties: [],
        inventoryProperties: [],
        bookings: [],
        payments: [],
        refunds: [],
        cancellationPolicies: [],
      })
    } finally {
      setLoading(false)
    }
  }, [fetchJson])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const combinedProperties = useMemo(() => {
    const map = new Map()

    dashboardData.properties.forEach((property) => {
      const propertyId = Number(property?.property_id || property?.id || 0)
      if (!propertyId) return
      map.set(propertyId, {
        property_id: propertyId,
        property_name: property?.property_name || property?.name || `Property ${propertyId}`,
        property_code: property?.property_code || property?.code || '',
      })
    })

    dashboardData.inventoryProperties.forEach((property) => {
      const propertyId = Number(property?.property_id || 0)
      if (!propertyId) return
      map.set(propertyId, {
        property_id: propertyId,
        property_name: property?.property_name || map.get(propertyId)?.property_name || `Property ${propertyId}`,
        property_code: property?.property_code || map.get(propertyId)?.property_code || '',
      })
    })

    dashboardData.bookings.forEach((booking) => {
      const propertyId = Number(getPropertyId(booking) || 0)
      if (!propertyId) return
      const previous = map.get(propertyId)
      const bookingPropertyName =
        booking?.property?.property_name || booking?.property_name || previous?.property_name || ''
      map.set(propertyId, {
        property_id: propertyId,
        property_name: bookingPropertyName || `Property ${propertyId}`,
        property_code: previous?.property_code || '',
      })
    })

    return Array.from(map.values()).sort((left, right) => left.property_name.localeCompare(right.property_name))
  }, [dashboardData.bookings, dashboardData.inventoryProperties, dashboardData.properties])

  useEffect(() => {
    if (isAdminScoped) {
      if (selectedPropertyId !== adminPropertyId) {
        setSelectedPropertyId(adminPropertyId)
      }
      return
    }

    if (!selectedPropertyId) return
    const hasSelection = combinedProperties.some(
      (property) => String(property.property_id) === String(selectedPropertyId),
    )
    if (!hasSelection) {
      setSelectedPropertyId('')
    }
  }, [adminPropertyId, combinedProperties, isAdminScoped, selectedPropertyId])

  const propertyNameLookup = useMemo(() => {
    return combinedProperties.reduce((map, property) => {
      map[property.property_id] = property.property_name
      return map
    }, {})
  }, [combinedProperties])

  const matchesSelectedProperty = useCallback(
    (propertyId) => {
      if (!selectedPropertyId) return true
      return String(propertyId || '') === String(selectedPropertyId)
    },
    [selectedPropertyId],
  )

  const propertiesInScope = useMemo(() => {
    if (!selectedPropertyId) return combinedProperties
    return combinedProperties.filter((property) => matchesSelectedProperty(property.property_id))
  }, [combinedProperties, matchesSelectedProperty, selectedPropertyId])

  const inventoryPropertiesInScope = useMemo(() => {
    return dashboardData.inventoryProperties.filter((property) => matchesSelectedProperty(property.property_id))
  }, [dashboardData.inventoryProperties, matchesSelectedProperty])

  const bookingsInScope = useMemo(() => {
    return dashboardData.bookings.filter((booking) => matchesSelectedProperty(getPropertyId(booking)))
  }, [dashboardData.bookings, matchesSelectedProperty])

  const paymentsInScope = useMemo(() => {
    return dashboardData.payments.filter((payment) => matchesSelectedProperty(getRelatedPropertyId(payment)))
  }, [dashboardData.payments, matchesSelectedProperty])

  const refundsInScope = useMemo(() => {
    return dashboardData.refunds.filter((refund) => matchesSelectedProperty(getRelatedPropertyId(refund)))
  }, [dashboardData.refunds, matchesSelectedProperty])

  const liveBookings = useMemo(() => {
    return bookingsInScope.filter((booking) => isLiveBooking(booking))
  }, [bookingsInScope])

  const inventoryToday = useMemo(() => {
    return summarizeInventoryForDay(inventoryPropertiesInScope, todayIso)
  }, [inventoryPropertiesInScope, todayIso])

  const occupancyRate = useMemo(() => {
    if (!inventoryToday.totalUnits) return 0
    return (inventoryToday.bookedUnits / inventoryToday.totalUnits) * 100
  }, [inventoryToday])

  const configuredRooms = useMemo(() => {
    return inventoryPropertiesInScope.reduce((count, property) => {
      return (
        count +
        (property?.room_types || []).reduce((roomCount, roomType) => {
          return roomCount + getRoomTypeCapacity(roomType)
        }, 0)
      )
    }, 0)
  }, [inventoryPropertiesInScope])

  const roomTypeCount = useMemo(() => {
    return inventoryPropertiesInScope.reduce((count, property) => count + (property?.room_types || []).length, 0)
  }, [inventoryPropertiesInScope])

  const grossBookingValue = useMemo(() => {
    return bookingsInScope.reduce((sum, booking) => sum + getGrandTotal(booking), 0)
  }, [bookingsInScope])

  const collectedAmount = useMemo(() => {
    return paymentsInScope.reduce((sum, payment) => {
      return PAID_PAYMENT_STATUSES.has(getPaymentStatus(payment))
        ? sum + toNumber(payment?.amount, 0)
        : sum
    }, 0)
  }, [paymentsInScope])

  const refundedAmount = useMemo(() => {
    return refundsInScope.reduce((sum, refund) => {
      return SUCCESSFUL_REFUND_STATUSES.has(getRefundStatus(refund))
        ? sum + toNumber(refund?.refund_amount || refund?.amount, 0)
        : sum
    }, 0)
  }, [refundsInScope])

  const netCollectedAmount = useMemo(() => {
    return Math.max(0, collectedAmount - refundedAmount)
  }, [collectedAmount, refundedAmount])

  const todayArrivals = useMemo(() => {
    return liveBookings.filter((booking) => toISODate(getCheckinDate(booking)) === todayIso)
  }, [liveBookings, todayIso])

  const todayDepartures = useMemo(() => {
    return liveBookings.filter((booking) => toISODate(getCheckoutDate(booking)) === todayIso)
  }, [liveBookings, todayIso])

  const inHouseTonight = useMemo(() => {
    const today = toDateOnly(todayIso)
    if (!today) return []

    return liveBookings.filter((booking) => {
      const checkin = toDateOnly(getCheckinDate(booking))
      const checkout = toDateOnly(getCheckoutDate(booking))
      return checkin && checkout && today >= checkin && today < checkout
    })
  }, [liveBookings, todayIso])

  const upcomingCheckins = useMemo(() => {
    const endDate = toDateOnly(dayWindow[dayWindow.length - 1]?.iso)
    if (!endDate) return []

    return liveBookings.filter((booking) => {
      const checkin = toDateOnly(getCheckinDate(booking))
      return checkin && checkin >= toDateOnly(todayIso) && checkin <= endDate
    })
  }, [dayWindow, liveBookings, todayIso])

  const inventoryDates = useMemo(() => {
    const dates = []
    inventoryPropertiesInScope.forEach((property) => {
      ;(property?.room_types || []).forEach((roomType) => {
        ;(roomType?.inventory || []).forEach((row) => {
          const iso = normalizeDateOnly(row?.inventory_date)
          if (iso) dates.push(iso)
        })
      })
    })
    return Array.from(new Set(dates)).sort()
  }, [inventoryPropertiesInScope])

  const inventoryCoverageDays = useMemo(() => {
    if (inventoryDates.length === 0) return 0
    const firstDate = toDateOnly(inventoryDates[0])
    const lastDate = toDateOnly(inventoryDates[inventoryDates.length - 1])
    if (!firstDate || !lastDate) return inventoryDates.length
    const dayMs = 24 * 60 * 60 * 1000
    return Math.round((lastDate.getTime() - firstDate.getTime()) / dayMs) + 1
  }, [inventoryDates])

  const inventoryOutlook = useMemo(() => {
    return dayWindow.map((day) => {
      const summary = summarizeInventoryForDay(inventoryPropertiesInScope, day.iso)
      return {
        ...day,
        ...summary,
        occupancyRate: summary.totalUnits ? (summary.bookedUnits / summary.totalUnits) * 100 : 0,
      }
    })
  }, [dayWindow, inventoryPropertiesInScope])

  const bookingStatusRows = useMemo(() => {
    const counts = new Map()
    bookingsInScope.forEach((booking) => {
      const status = getBookingStatus(booking) || 'unknown'
      counts.set(status, (counts.get(status) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((left, right) => right.count - left.count)
  }, [bookingsInScope])

  const paymentStatusRows = useMemo(() => {
    const counts = new Map()
    const amounts = new Map()

    paymentsInScope.forEach((payment) => {
      const status = getPaymentStatus(payment) || 'unknown'
      counts.set(status, (counts.get(status) || 0) + 1)
      amounts.set(status, (amounts.get(status) || 0) + toNumber(payment?.amount, 0))
    })

    return Array.from(counts.entries())
      .map(([status, count]) => ({
        status,
        count,
        amount: amounts.get(status) || 0,
      }))
      .sort((left, right) => right.amount - left.amount)
  }, [paymentsInScope])

  const propertiesWithoutRoomTypes = useMemo(() => {
    return propertiesInScope.filter((property) => {
      const inventoryProperty = inventoryPropertiesInScope.find(
        (item) => String(item.property_id) === String(property.property_id),
      )
      return !inventoryProperty || (inventoryProperty.room_types || []).length === 0
    })
  }, [inventoryPropertiesInScope, propertiesInScope])

  const dashboardAlerts = useMemo(() => {
    const alerts = []

    if (propertiesWithoutRoomTypes.length > 0) {
      alerts.push({
        color: 'warning',
        message: `${propertiesWithoutRoomTypes.map((property) => property.property_name).join(', ')} need room type setup.`,
      })
    }

    if (inventoryToday.totalUnits === 0) {
      alerts.push({
        color: 'danger',
        message: 'No room inventory is available for today in the selected scope.',
      })
    }

    const cancelledBookings = bookingsInScope.filter((booking) => getBookingStatus(booking) === 'cancelled').length
    if (cancelledBookings > 0) {
      alerts.push({
        color: 'info',
        message: `${cancelledBookings} booking cancellation${cancelledBookings === 1 ? '' : 's'} recorded so far.`,
      })
    }

    const pendingRefunds = refundsInScope.filter((refund) => getRefundStatus(refund) === 'pending').length
    if (pendingRefunds > 0) {
      alerts.push({
        color: 'warning',
        message: `${pendingRefunds} refund${pendingRefunds === 1 ? '' : 's'} still pending processing.`,
      })
    }

    if (alerts.length === 0) {
      alerts.push({
        color: 'success',
        message: 'All connected PMS modules returned usable data for this dashboard.',
      })
    }

    return alerts
  }, [bookingsInScope, inventoryToday.totalUnits, propertiesWithoutRoomTypes, refundsInScope])

  const propertyRows = useMemo(() => {
    return propertiesInScope
      .map((property) => {
        const inventoryProperty = inventoryPropertiesInScope.find(
          (item) => String(item.property_id) === String(property.property_id),
        )
        const propertyBookings = bookingsInScope.filter(
          (booking) => String(getPropertyId(booking)) === String(property.property_id),
        )
        const propertyInventorySummary = summarizeInventoryForDay(inventoryProperty ? [inventoryProperty] : [], todayIso)
        const liveCount = propertyBookings.filter((booking) => isLiveBooking(booking)).length
        const bookingValue = propertyBookings.reduce((sum, booking) => sum + getGrandTotal(booking), 0)
        const propertyRoomTypes = inventoryProperty?.room_types || []
        const propertyRoomCount = propertyRoomTypes.reduce((sum, roomType) => {
          return sum + getRoomTypeCapacity(roomType)
        }, 0)

        return {
          property_id: property.property_id,
          property_name: property.property_name,
          property_code: property.property_code,
          roomTypeCount: propertyRoomTypes.length,
          roomCount: propertyRoomCount,
          liveBookings: liveCount,
          occupancyRate: propertyInventorySummary.totalUnits
            ? (propertyInventorySummary.bookedUnits / propertyInventorySummary.totalUnits) * 100
            : 0,
          availabilityLabel: propertyInventorySummary.totalUnits
            ? `${propertyInventorySummary.availableUnits}/${propertyInventorySummary.totalUnits} free`
            : 'No inventory',
          bookingValue,
        }
      })
      .sort((left, right) => right.roomCount - left.roomCount || left.property_name.localeCompare(right.property_name))
  }, [bookingsInScope, inventoryPropertiesInScope, propertiesInScope, todayIso])

  const recentBookings = useMemo(() => {
    return [...bookingsInScope]
      .sort((left, right) => {
        return new Date(getCreatedAt(right) || 0).getTime() - new Date(getCreatedAt(left) || 0).getTime()
      })
      .slice(0, 6)
  }, [bookingsInScope])

  const scopeLabel = useMemo(() => {
    if (!selectedPropertyId) return 'All properties'
    return (
      combinedProperties.find((property) => String(property.property_id) === String(selectedPropertyId))
        ?.property_name || `Property ${selectedPropertyId}`
    )
  }, [combinedProperties, selectedPropertyId])

  const statusChartData = useMemo(() => {
    return {
      labels: bookingStatusRows.map((row) => row.status.replace(/_/g, ' ')),
      datasets: [
        {
          backgroundColor: ['#2eb85c', '#f9b115', '#3399ff', '#e55353', '#5856d6', '#6b7785'],
          data: bookingStatusRows.map((row) => row.count),
        },
      ],
    }
  }, [bookingStatusRows])

  const inventoryChartData = useMemo(() => {
    return {
      labels: inventoryOutlook.map((day) => `${day.dayLabel} ${day.label}`),
      datasets: [
        {
          label: 'Booked rooms',
          backgroundColor: 'rgba(229, 83, 83, 0.16)',
          borderColor: '#e55353',
          pointBackgroundColor: '#e55353',
          tension: 0.35,
          fill: true,
          data: inventoryOutlook.map((day) => day.bookedUnits),
        },
        {
          label: 'Available rooms',
          backgroundColor: 'rgba(46, 184, 92, 0.08)',
          borderColor: '#2eb85c',
          pointBackgroundColor: '#2eb85c',
          tension: 0.35,
          fill: true,
          data: inventoryOutlook.map((day) => day.availableUnits),
        },
      ],
    }
  }, [inventoryOutlook])

  const chartOptions = useMemo(() => {
    return {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getStyle('--cui-body-color'),
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: getStyle('--cui-body-color'),
          },
          grid: {
            color: getStyle('--cui-border-color-translucent'),
            drawOnChartArea: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: getStyle('--cui-body-color'),
          },
          grid: {
            color: getStyle('--cui-border-color-translucent'),
          },
        },
      },
    }
  }, [])

  const doughnutOptions = useMemo(() => {
    return {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getStyle('--cui-body-color'),
          },
        },
      },
    }
  }, [])

  if (loading) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="py-5 text-center">
          <CSpinner />
          <div className="mt-3 text-body-secondary">Loading PMS dashboard...</div>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                <div>
                  <div className="text-body-secondary text-uppercase small fw-semibold">
                    PMS operations dashboard
                  </div>
                  <h3 className="mb-1 mt-2">PMS Operational Overview</h3>
                  <div className="text-body-secondary">
                    Centralized view of properties, room inventory, bookings, payments, refunds,
                    and cancellation policies across your PMS.
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <CBadge color="primary">{scopeLabel}</CBadge>
                    <CBadge color="info">{propertiesInScope.length} properties</CBadge>
                    <CBadge color="success">{roomTypeCount} room types</CBadge>
                    <CBadge color="warning">{dashboardData.cancellationPolicies.length} policies</CBadge>
                  </div>
                </div>

                <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-start gap-2">
                  {!isAdminScoped && combinedProperties.length > 1 ? (
                    <CFormSelect
                      value={selectedPropertyId}
                      onChange={(event) => setSelectedPropertyId(event.target.value)}
                      aria-label="Select property scope"
                    >
                      <option value="">All properties</option>
                      {combinedProperties.map((property) => (
                        <option key={property.property_id} value={String(property.property_id)}>
                          {property.property_name}
                          {property.property_code ? ` (${property.property_code})` : ''}
                        </option>
                      ))}
                    </CFormSelect>
                  ) : null}
                  <IconOnlyButton
                    icon={cilReload}
                    label="Refresh dashboard"
                    tone="info"
                    onClick={loadDashboard}
                  />
                </div>
              </div>
              <div className="small text-body-secondary mt-3">
                Last refresh: {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : '-'}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {error ? (
        <CAlert color="danger" className="mb-4">
          {error}
        </CAlert>
      ) : null}

      {issues.length > 0 ? (
        <CAlert color="warning" className="mb-4">
          Partial data only: {issues.join(', ')}.
        </CAlert>
      ) : null}

      <CRow className="mb-4" xs={{ cols: 1 }} md={{ cols: 2 }} xl={{ cols: 3 }}>
        <CCol className="mb-4">
          <MetricCard
            title="Properties in scope"
            value={propertiesInScope.length}
            subtitle={`${combinedProperties.length} total properties visible in PMS`}
            icon={cilBuilding}
            tone="primary"
          />
        </CCol>
        <CCol className="mb-4">
          <MetricCard
            title="Configured rooms"
            value={configuredRooms}
            subtitle={`${roomTypeCount} room types currently mapped to inventory`}
            icon={cilBed}
            tone="info"
          />
        </CCol>
        <CCol className="mb-4">
          <MetricCard
            title="Occupancy today"
            value={formatPercent(occupancyRate)}
            subtitle={`${inventoryToday.bookedUnits} booked / ${inventoryToday.availableUnits} free`}
            icon={cilHome}
            tone="success"
            progressValue={occupancyRate}
          />
        </CCol>
        <CCol className="mb-4">
          <MetricCard
            title="Live bookings"
            value={liveBookings.length}
            subtitle={`${todayArrivals.length} arrivals and ${todayDepartures.length} departures today`}
            icon={cilPeople}
            tone="warning"
          />
        </CCol>
        <CCol className="mb-4">
          <MetricCard
            title="Net cash in"
            value={formatCurrency(netCollectedAmount)}
            subtitle={`${formatCurrency(collectedAmount)} collected minus ${formatCurrency(refundedAmount)} refunded`}
            icon={cilWallet}
            tone="primary"
          />
        </CCol>
        <CCol className="mb-4">
          <MetricCard
            title="Gross booking value"
            value={formatCurrency(grossBookingValue)}
            subtitle={`${bookingsInScope.length} bookings in current scope`}
            icon={cilMoney}
            tone="danger"
          />
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol xl={8} className="mb-4">
          <CCard className="h-100 border-0 shadow-sm">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">7-day inventory outlook</div>
                <div className="small text-body-secondary">
                  Booked vs available room units from the room inventory table.
                </div>
              </div>
              <CBadge color="info">{inventoryCoverageDays} day inventory horizon</CBadge>
            </CCardHeader>
            <CCardBody>
              <div style={{ height: 320 }}>
                <CChartLine data={inventoryChartData} options={chartOptions} />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xl={4} className="mb-4">
          <CCard className="h-100 border-0 shadow-sm">
            <CCardHeader>
              <div className="fw-semibold">Operations pulse</div>
              <div className="small text-body-secondary">
                First-pass daily snapshot for front desk and finance.
              </div>
            </CCardHeader>
            <CCardBody>
              <CListGroup flush>
                <CListGroupItem className="px-0 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">Arrivals today</div>
                    <div className="small text-body-secondary">
                      {upcomingCheckins.length} check-ins across the next 7 days
                    </div>
                  </div>
                  <CBadge color="primary">{todayArrivals.length}</CBadge>
                </CListGroupItem>
                <CListGroupItem className="px-0 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">Departures today</div>
                    <div className="small text-body-secondary">
                      {inHouseTonight.length} guests expected to be in-house tonight
                    </div>
                  </div>
                  <CBadge color="info">{todayDepartures.length}</CBadge>
                </CListGroupItem>
                <CListGroupItem className="px-0 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">Refunds issued</div>
                    <div className="small text-body-secondary">{formatCurrency(refundedAmount)} processed</div>
                  </div>
                  <CBadge color="warning">{refundsInScope.length}</CBadge>
                </CListGroupItem>
                <CListGroupItem className="px-0 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">Inventory date range</div>
                    <div className="small text-body-secondary">
                      {inventoryDates.length > 0
                        ? `${formatDate(inventoryDates[0])} to ${formatDate(
                            inventoryDates[inventoryDates.length - 1],
                          )}`
                        : 'No inventory rows loaded'}
                    </div>
                  </div>
                  <CBadge color="success">{inventoryCoverageDays || 0}d</CBadge>
                </CListGroupItem>
              </CListGroup>

              <div className="mt-4">
                <div className="text-body-secondary text-uppercase small fw-semibold mb-2">Alerts</div>
                {dashboardAlerts.map((alert) => (
                  <CAlert
                    key={`${alert.color}-${alert.message}`}
                    color={alert.color}
                    className="d-flex align-items-start gap-2 mb-2"
                  >
                    <CIcon
                      icon={alert.color === 'success' ? cilCheckCircle : cilWarning}
                      className="mt-1"
                    />
                    <span>{alert.message}</span>
                  </CAlert>
                ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol xl={4} className="mb-4">
          <CCard className="h-100 border-0 shadow-sm">
            <CCardHeader>
              <div className="fw-semibold">Booking status mix</div>
              <div className="small text-body-secondary">
                Distribution of booking lifecycle states in the selected scope.
              </div>
            </CCardHeader>
            <CCardBody>
              <div style={{ height: 260 }}>
                <CChartDoughnut data={statusChartData} options={doughnutOptions} />
              </div>
              <div className="mt-3">
                {bookingStatusRows.length === 0 ? (
                  <div className="text-body-secondary small">No booking records available.</div>
                ) : (
                  bookingStatusRows.map((row) => (
                    <div
                      key={row.status}
                      className="d-flex justify-content-between align-items-center py-2 border-top"
                    >
                      <span className="text-capitalize">{row.status.replace(/_/g, ' ')}</span>
                      <CBadge color={getStatusColor(row.status)}>{row.count}</CBadge>
                    </div>
                  ))
                )}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xl={8} className="mb-4">
          <CCard className="h-100 border-0 shadow-sm">
            <CCardHeader>
              <div className="fw-semibold">Property health</div>
              <div className="small text-body-secondary">
                Combines setup coverage, live bookings, and today&apos;s availability by property.
              </div>
            </CCardHeader>
            <CCardBody className="p-0">
              <CTable align="middle" hover responsive className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Property</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Room Types</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Rooms</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Live Bookings</CTableHeaderCell>
                    <CTableHeaderCell>Today Availability</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Booking Value</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {propertyRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={6} className="text-center py-4 text-body-secondary">
                        No property data available.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    propertyRows.map((row) => (
                      <CTableRow key={row.property_id}>
                        <CTableDataCell>
                          <div className="fw-semibold">{row.property_name}</div>
                          <div className="small text-body-secondary">
                            {row.property_code || `Property ID ${row.property_id}`}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          {row.roomTypeCount > 0 ? (
                            <CBadge color="info">{row.roomTypeCount}</CBadge>
                          ) : (
                            <CBadge color="warning">Setup needed</CBadge>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">{row.roomCount}</CTableDataCell>
                        <CTableDataCell className="text-center">
                          <CBadge color="success">{row.liveBookings}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">{row.availabilityLabel}</div>
                          <CProgress
                            className="mt-2"
                            height={6}
                            color={row.occupancyRate >= 80 ? 'danger' : row.occupancyRate >= 50 ? 'warning' : 'success'}
                            value={row.occupancyRate}
                          />
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          {formatCurrency(row.bookingValue)}
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol xl={7} className="mb-4">
          <CCard className="h-100 border-0 shadow-sm">
            <CCardHeader>
              <div className="fw-semibold">Recent bookings</div>
              <div className="small text-body-secondary">
                Latest booking activity from the bookings table.
              </div>
            </CCardHeader>
            <CCardBody className="p-0">
              <CTable align="middle" hover responsive className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Booking</CTableHeaderCell>
                    <CTableHeaderCell>Guest</CTableHeaderCell>
                    <CTableHeaderCell>Stay</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {recentBookings.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center py-4 text-body-secondary">
                        No bookings available in the selected scope.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    recentBookings.map((booking) => (
                      <CTableRow key={getBookingCode(booking)}>
                        <CTableDataCell>
                          <div className="fw-semibold">{getBookingCode(booking)}</div>
                          <div className="small text-body-secondary">
                            {getPropertyName(booking, propertyNameLookup)}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">{getGuestName(booking)}</div>
                          <div className="small text-body-secondary">
                            Created {formatDate(getCreatedAt(booking))}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">{formatDate(getCheckinDate(booking))}</div>
                          <div className="small text-body-secondary">
                            to {formatDate(getCheckoutDate(booking))}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={getStatusColor(getBookingStatus(booking))}>
                            {getBookingStatus(booking) || 'unknown'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          {formatCurrency(getGrandTotal(booking))}
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xl={5} className="mb-4">
          <CCard className="border-0 shadow-sm mb-4">
            <CCardHeader>
              <div className="fw-semibold">Payment snapshot</div>
              <div className="small text-body-secondary">
                Status mix from the payments table for the current scope.
              </div>
            </CCardHeader>
            <CCardBody>
              {paymentStatusRows.length === 0 ? (
                <div className="text-body-secondary small">No payment records available.</div>
              ) : (
                paymentStatusRows.map((row) => (
                  <div
                    key={row.status}
                    className="d-flex justify-content-between align-items-center py-2 border-bottom"
                  >
                    <div>
                      <div className="fw-semibold text-capitalize">{row.status.replace(/_/g, ' ')}</div>
                      <div className="small text-body-secondary">{formatCurrency(row.amount)}</div>
                    </div>
                    <CBadge color={getStatusColor(row.status)}>{row.count}</CBadge>
                  </div>
                ))
              )}
            </CCardBody>
          </CCard>

          <CCard className="border-0 shadow-sm">
            <CCardHeader>
              <div className="fw-semibold">Cancellation policy shelf</div>
              <div className="small text-body-secondary">
                Available policies you can later surface in richer refund/cancel analytics.
              </div>
            </CCardHeader>
            <CCardBody>
              {dashboardData.cancellationPolicies.length === 0 ? (
                <div className="text-body-secondary small">No cancellation policies found.</div>
              ) : (
                <CListGroup flush>
                  {dashboardData.cancellationPolicies.slice(0, 6).map((policy) => (
                    <CListGroupItem key={policy?.id || policy?.name} className="px-0">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <div className="fw-semibold">{policy?.name || 'Unnamed policy'}</div>
                          <div className="small text-body-secondary mt-1">
                            {safePolicyRuleLabel(policy)}
                          </div>
                        </div>
                        <CBadge color="warning">
                          {toNumber(policy?.deduction_percentage, 0).toFixed(0)}%
                        </CBadge>
                      </div>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
