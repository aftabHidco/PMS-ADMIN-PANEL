import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { cilCheckCircle, cilReload, cilSave } from '@coreui/icons'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormSelect,
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

const DAYS_TO_SHOW = 7
const CANCELLED_STATUSES = new Set(['cancelled', 'canceled'])

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.bookings)) return payload.bookings
  return []
}

const normalizeDateOnly = (value) => {
  const date = String(value || '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''
}

const normalizeRoomType = (item) => {
  const roomTypeId = Number(item?.room_type_id || 0)
  if (!roomTypeId) return null

  const inventory = Array.isArray(item?.inventory)
    ? item.inventory
        .map((row) => {
          const inventoryDate = normalizeDateOnly(row?.inventory_date)
          if (!inventoryDate) return null

          return {
            inventory_id: Number(row?.inventory_id || 0) || null,
            inventory_date: inventoryDate,
            total_units: Number(row?.total_units ?? 0),
            available_units: Number(row?.available_units ?? 0),
            booking_units: Number(row?.booking_units ?? row?.booked_units ?? 0),
            booked_units: Number(row?.booked_units ?? row?.booking_units ?? 0),
          }
        })
        .filter(Boolean)
    : []

  return {
    room_type_id: roomTypeId,
    room_type_code: item?.room_type_code || null,
    room_type_name: item?.room_type_name || null,
    room_qty: Number(item?.room_qty ?? item?.qty ?? 0),
    base_occupancy: Number(item?.base_occupancy ?? 0),
    max_occupancy: Number(item?.max_occupancy ?? 0),
    inventory,
  }
}

const mergePropertiesWithRoomTypes = (items) => {
  const propertyMap = new Map()

  items.forEach((item) => {
    const propertyId = Number(item?.property_id || 0)
    if (!propertyId) return

    if (!propertyMap.has(propertyId)) {
      propertyMap.set(propertyId, {
        property_id: propertyId,
        property_name: item?.property_name || `Property ${propertyId}`,
        property_code: item?.property_code || null,
        room_types: [],
      })
    }

    const target = propertyMap.get(propertyId)
    const roomTypeMap = new Map(
      (target.room_types || [])
        .map(normalizeRoomType)
        .filter(Boolean)
        .map((roomType) => [roomType.room_type_id, roomType]),
    )

    const sourceRoomTypes = Array.isArray(item?.room_types) ? item.room_types : []
    sourceRoomTypes.forEach((roomType) => {
      const normalized = normalizeRoomType(roomType)
      if (!normalized) return
      roomTypeMap.set(normalized.room_type_id, normalized)
    })

    target.room_types = Array.from(roomTypeMap.values()).sort(
      (a, b) => a.room_type_id - b.room_type_id,
    )
  })

  return Array.from(propertyMap.values()).sort((a, b) => a.property_id - b.property_id)
}

const normalizeRole = (value) => String(value || '').trim().toLowerCase()
const normalizeStatus = (value) => String(value || '').trim().toLowerCase()

const toDateOnly = (dateLike) => {
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const toISODate = (dateLike) => {
  const date = toDateOnly(dateLike)
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatDate = (dateLike) => {
  const date = toDateOnly(dateLike)
  if (!date) return '-'
  return date.toLocaleDateString('en-GB')
}

const formatDay = (dateLike) => {
  const date = toDateOnly(dateLike)
  if (!date) return '-'
  return date.toLocaleDateString('en-GB', { weekday: 'short' })
}

const getDateWindow = () => {
  const today = toDateOnly(new Date())
  if (!today) return []

  return Array.from({ length: DAYS_TO_SHOW }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    const iso = toISODate(date)

    return {
      iso,
      dateLabel: formatDate(date),
      dayLabel: formatDay(date),
      fullLabel: `${formatDay(date)} ${formatDate(date)}`,
    }
  })
}

const getCellKey = (roomTypeId, inventoryDate) => `${roomTypeId}-${inventoryDate}`

const getInventoryRowForDay = (roomType, dayIso) => {
  if (!roomType) return null
  const inventoryRows = Array.isArray(roomType.inventory) ? roomType.inventory : []
  return inventoryRows.find((row) => normalizeDateOnly(row?.inventory_date) === dayIso) || null
}

const getTotalUnitsForDay = (roomType, dayIso) => {
  const inventory = getInventoryRowForDay(roomType, dayIso)
  const totalFromInventory = Number(inventory?.total_units)
  if (Number.isInteger(totalFromInventory) && totalFromInventory >= 0) {
    return totalFromInventory
  }

  const fallback = Number(roomType?.room_qty || 0)
  if (Number.isInteger(fallback) && fallback >= 0) {
    return fallback
  }

  return 0
}

const getAvailableUnitsForDay = (roomType, dayIso) => {
  const inventory = getInventoryRowForDay(roomType, dayIso)
  const availableFromInventory = Number(inventory?.available_units)
  if (Number.isInteger(availableFromInventory) && availableFromInventory >= 0) {
    return availableFromInventory
  }
  return 0
}

const isActiveOnDay = (booking, dayIso) => {
  const checkin = toISODate(booking?.checkin_date)
  const checkout = toISODate(booking?.checkout_date)
  if (!checkin || !checkout) return false

  return dayIso >= checkin && dayIso < checkout
}

const BookingLocks = () => {
  const auth = useAuth()
  const API_BASE = auth.API_BASE

  const role = normalizeRole(auth?.user?.role)
  const isSuperAdmin = role === 'super_admin'

  const dateWindow = useMemo(() => getDateWindow(), [])

  const [loading, setLoading] = useState(true)
  const [savingCellKey, setSavingCellKey] = useState('')
  const [bulkSavingRoomTypeId, setBulkSavingRoomTypeId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [properties, setProperties] = useState([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [roomTypes, setRoomTypes] = useState([])
  const [bulkRoomTypeId, setBulkRoomTypeId] = useState('')
  const [cellInputs, setCellInputs] = useState({})
  const [savedInputs, setSavedInputs] = useState({})
  const [bookingsByDay, setBookingsByDay] = useState({})

  const selectedProperty = useMemo(() => {
    if (!properties.length) return null

    if (isSuperAdmin) {
      const selected = properties.find((property) => String(property.property_id) === selectedPropertyId)
      return selected || properties[0] || null
    }

    const adminPropertyId = String(auth?.user?.property_id || '')
    if (adminPropertyId) {
      const selected = properties.find((property) => String(property.property_id) === adminPropertyId)
      if (selected) return selected
    }

    return properties[0] || null
  }, [auth, isSuperAdmin, properties, selectedPropertyId])

  const loadRoomTypes = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/room-inventory/room-types`, {
        headers: { ...auth.getAuthHeader() },
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Failed to fetch room inventory room types')
      }

      const rawProperties = Array.isArray(data?.data?.properties)
        ? data.data.properties
        : Array.isArray(data?.properties)
        ? data.properties
        : Array.isArray(data?.data)
        ? data.data
        : []
      const nextProperties = mergePropertiesWithRoomTypes(rawProperties)
      setProperties(nextProperties)

      if (isSuperAdmin) {
        setSelectedPropertyId((prev) => {
          if (prev && nextProperties.some((property) => String(property.property_id) === prev)) {
            return prev
          }
          return nextProperties[0] ? String(nextProperties[0].property_id) : ''
        })
      } else {
        setSelectedPropertyId(nextProperties[0] ? String(nextProperties[0].property_id) : '')
      }
    } catch (err) {
      console.error('Failed to fetch room inventory room types:', err)
      setProperties([])
      setSelectedPropertyId('')
      setError(err.message || 'Failed to fetch room inventory room types')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, auth, isSuperAdmin])

  const loadRoomTypesForSelectedProperty = useCallback(async () => {
    if (!selectedProperty?.property_id) {
      setRoomTypes([])
      return
    }

    try {
      const filter = encodeURIComponent(
        JSON.stringify({ property_id: Number(selectedProperty.property_id) }),
      )

      const res = await fetch(`${API_BASE}/room-types?_page=1&_perPage=500&filter=${filter}`, {
        headers: { ...auth.getAuthHeader() },
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to fetch room types')
      }

      const rows = extractArray(data)
      const roomTypeMap = new Map()
      const inventoryRoomTypeMap = new Map(
        (Array.isArray(selectedProperty?.room_types) ? selectedProperty.room_types : [])
          .map(normalizeRoomType)
          .filter(Boolean)
          .map((roomType) => [roomType.room_type_id, roomType]),
      )

      rows.forEach((row) => {
        const normalized = normalizeRoomType(row)
        if (!normalized) return
        const inventoryRoomType = inventoryRoomTypeMap.get(normalized.room_type_id)
        roomTypeMap.set(normalized.room_type_id, {
          ...normalized,
          inventory:
            Array.isArray(inventoryRoomType?.inventory) && inventoryRoomType.inventory.length
              ? inventoryRoomType.inventory
              : normalized.inventory,
        })
      })

      if (roomTypeMap.size > 0) {
        setRoomTypes(
          Array.from(roomTypeMap.values()).sort((a, b) => a.room_type_id - b.room_type_id),
        )
        return
      }

      const fallback = Array.isArray(selectedProperty?.room_types)
        ? selectedProperty.room_types.map(normalizeRoomType).filter(Boolean)
        : []
      setRoomTypes(fallback)
    } catch (err) {
      console.error('Failed to fetch room types for selected property:', err)
      const fallback = Array.isArray(selectedProperty?.room_types)
        ? selectedProperty.room_types.map(normalizeRoomType).filter(Boolean)
        : []
      setRoomTypes(fallback)
    }
  }, [API_BASE, auth, selectedProperty])

  const loadBookings = useCallback(async () => {
    if (!selectedProperty?.property_id) {
      const empty = {}
      dateWindow.forEach((day) => {
        empty[day.iso] = 0
      })
      setBookingsByDay(empty)
      return
    }

    try {
      const query = new URLSearchParams({
        _page: '1',
        _perPage: '500',
        property_id: String(selectedProperty.property_id),
      })

      const res = await fetch(`${API_BASE}/bookings?${query.toString()}`, {
        headers: { ...auth.getAuthHeader() },
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Failed to fetch bookings')
      }

      const bookings = extractArray(data)
      const next = {}
      dateWindow.forEach((day) => {
        next[day.iso] = 0
      })

      bookings.forEach((booking) => {
        const status = normalizeStatus(booking?.booking_status || booking?.status)
        if (CANCELLED_STATUSES.has(status)) return

        dateWindow.forEach((day) => {
          if (isActiveOnDay(booking, day.iso)) {
            next[day.iso] += 1
          }
        })
      })

      setBookingsByDay(next)
    } catch (err) {
      console.error('Failed to fetch bookings for room inventory:', err)

      const empty = {}
      dateWindow.forEach((day) => {
        empty[day.iso] = 0
      })
      setBookingsByDay(empty)
    }
  }, [API_BASE, auth, dateWindow, selectedProperty])

  useEffect(() => {
    loadRoomTypes()
  }, [loadRoomTypes])

  useEffect(() => {
    if (!selectedProperty) {
      setCellInputs({})
      setSavedInputs({})
      return
    }

    const defaults = {}

    roomTypes.forEach((roomType) => {
      dateWindow.forEach((day) => {
        const available = getAvailableUnitsForDay(roomType, day.iso)
        defaults[getCellKey(roomType.room_type_id, day.iso)] = String(available)
      })
    })

    setCellInputs(defaults)
    setSavedInputs(defaults)
  }, [dateWindow, roomTypes, selectedProperty])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  useEffect(() => {
    loadRoomTypesForSelectedProperty()
  }, [loadRoomTypesForSelectedProperty])

  useEffect(() => {
    if (!roomTypes.length) {
      setBulkRoomTypeId('')
      return
    }

    setBulkRoomTypeId((prev) => {
      if (prev && roomTypes.some((roomType) => String(roomType.room_type_id) === prev)) {
        return prev
      }
      return String(roomTypes[0].room_type_id)
    })
  }, [roomTypes])

  const selectedBulkRoomType = useMemo(() => {
    if (!bulkRoomTypeId) return null
    return (
      roomTypes.find((roomType) => String(roomType.room_type_id) === bulkRoomTypeId) || null
    )
  }, [bulkRoomTypeId, roomTypes])

  const onCellInputChange = (roomTypeId, dayIso, value) => {
    if (value !== '' && !/^\d+$/.test(value)) return

    const key = getCellKey(roomTypeId, dayIso)
    setCellInputs((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveCell = useCallback(
    async (roomType, day) => {
      if (!selectedProperty?.property_id) return

      const key = getCellKey(roomType.room_type_id, day.iso)
      const rawValue = String(cellInputs[key] ?? '').trim()
      const fallbackValue = String(savedInputs[key] ?? getAvailableUnitsForDay(roomType, day.iso))

      if (rawValue === '') {
        setCellInputs((prev) => ({ ...prev, [key]: fallbackValue }))
        return
      }

      const availableUnits = Number(rawValue)
      const totalUnits = getTotalUnitsForDay(roomType, day.iso)

      if (!Number.isInteger(availableUnits) || availableUnits < 0) {
        setError(`Available units must be a non-negative number (${roomType.room_type_name})`)
        setCellInputs((prev) => ({ ...prev, [key]: fallbackValue }))
        return
      }

      if (availableUnits > totalUnits) {
        setError(`Available units cannot be more than ${totalUnits} (${roomType.room_type_name})`)
        setCellInputs((prev) => ({ ...prev, [key]: fallbackValue }))
        return
      }

      const normalizedValue = String(availableUnits)
      if (normalizedValue === fallbackValue) {
        if (cellInputs[key] !== normalizedValue) {
          setCellInputs((prev) => ({ ...prev, [key]: normalizedValue }))
        }
        return
      }

      setSavingCellKey(key)
      setError('')
      setSuccess('')

      try {
        const res = await fetch(`${API_BASE}/room-inventory`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...auth.getAuthHeader(),
          },
          body: JSON.stringify({
            property_id: Number(selectedProperty.property_id),
            room_type_id: Number(roomType.room_type_id),
            inventory_date: day.iso,
            total_units: totalUnits,
            available_units: availableUnits,
          }),
        })
        const data = await res.json().catch(() => ({}))

        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || 'Failed to save room inventory')
        }

        setSavedInputs((prev) => ({
          ...prev,
          [key]: normalizedValue,
        }))
        setCellInputs((prev) => ({
          ...prev,
          [key]: normalizedValue,
        }))
        setSuccess(`${roomType.room_type_name} (${day.fullLabel}) inventory saved`)
      } catch (err) {
        console.error('Failed to save room inventory:', err)
        setError(err.message || 'Failed to save room inventory')
        setCellInputs((prev) => ({ ...prev, [key]: fallbackValue }))
      } finally {
        setSavingCellKey('')
      }
    },
    [API_BASE, auth, cellInputs, savedInputs, selectedProperty],
  )

  const saveRoomTypeWeek = useCallback(
    async (roomType, fillMax = false) => {
      if (!selectedProperty?.property_id) return

      const roomTypeId = Number(roomType?.room_type_id || 0)
      if (!roomTypeId) return

      const entries = []
      const nextCellInputs = { ...cellInputs }
      const nextSavedInputs = { ...savedInputs }

      for (const day of dateWindow) {
        const cellKey = getCellKey(roomTypeId, day.iso)
        const totalUnits = getTotalUnitsForDay(roomType, day.iso)

        const rawInput = String(cellInputs[cellKey] ?? '').trim()
        const fallbackValue = String(savedInputs[cellKey] ?? getAvailableUnitsForDay(roomType, day.iso))

        const desiredValue = fillMax
          ? String(totalUnits)
          : (rawInput === '' ? fallbackValue : rawInput)

        const availableUnits = Number(desiredValue)

        if (!Number.isInteger(availableUnits) || availableUnits < 0) {
          setError(
            `Available units must be a non-negative number (${roomType.room_type_name} - ${day.fullLabel})`,
          )
          return
        }

        if (availableUnits > totalUnits) {
          setError(
            `Available units cannot be more than ${totalUnits} (${roomType.room_type_name} - ${day.fullLabel})`,
          )
          return
        }

        const normalizedValue = String(availableUnits)
        nextCellInputs[cellKey] = normalizedValue
        nextSavedInputs[cellKey] = normalizedValue

        entries.push({
          property_id: Number(selectedProperty.property_id),
          room_type_id: roomTypeId,
          inventory_date: day.iso,
          total_units: totalUnits,
          available_units: availableUnits,
        })
      }

      setBulkSavingRoomTypeId(roomTypeId)
      setError('')
      setSuccess('')

      try {
        const res = await fetch(`${API_BASE}/room-inventory/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...auth.getAuthHeader(),
          },
          body: JSON.stringify({ entries }),
        })
        const data = await res.json().catch(() => ({}))

        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || 'Failed to save 7-day inventory')
        }

        setCellInputs(nextCellInputs)
        setSavedInputs(nextSavedInputs)
        setSuccess(
          fillMax
            ? `${roomType.room_type_name}: max qty filled and saved for 7 days`
            : `${roomType.room_type_name}: 7-day inventory saved`,
        )
      } catch (err) {
        console.error('Failed to save 7-day inventory:', err)
        setError(err.message || 'Failed to save 7-day inventory')
      } finally {
        setBulkSavingRoomTypeId(null)
      }
    },
    [API_BASE, auth, cellInputs, dateWindow, savedInputs, selectedProperty],
  )

  const handleRefresh = async () => {
    setSuccess('')
    await loadRoomTypes()
    await loadBookings()
  }

  if (loading) {
    return (
      <div className="text-center my-4">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-0">Room Inventory (7 Days)</h4>
          <small className="text-medium-emphasis">
            Editable value is available units. Dates are from today to next 6 days.
          </small>
        </div>
        <IconOnlyButton
          icon={cilReload}
          tone="info"
          label="Refresh Room Inventory"
          onClick={handleRefresh}
        />
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}
        {success && <CAlert color="success">{success}</CAlert>}

        {(isSuperAdmin || roomTypes.length > 0) && (
          <div className="mb-3 d-flex align-items-end gap-2 flex-nowrap">
            {isSuperAdmin && (
              <div style={{ minWidth: '260px', maxWidth: '360px' }}>
                <CFormSelect
                  label="Select Property"
                  value={selectedPropertyId}
                  onChange={(e) => {
                    setSelectedPropertyId(e.target.value)
                    setSuccess('')
                    setError('')
                  }}
                >
                  {properties.length === 0 && <option value="">No properties found</option>}
                  {properties.map((property) => (
                    <option key={property.property_id} value={String(property.property_id)}>
                      {property.property_name} ({property.property_code || '-'})
                    </option>
                  ))}
                </CFormSelect>
              </div>
            )}

            <div style={{ minWidth: '280px', maxWidth: '420px', flex: '1 1 auto' }}>
              <CFormSelect
                label="Bulk Action Room Type"
                value={bulkRoomTypeId}
                onChange={(e) => setBulkRoomTypeId(e.target.value)}
                disabled={bulkSavingRoomTypeId !== null || roomTypes.length === 0}
              >
                {roomTypes.length === 0 && <option value="">No room types found</option>}
                {roomTypes.map((roomType) => (
                  <option key={roomType.room_type_id} value={String(roomType.room_type_id)}>
                    {roomType.room_type_name || `Room Type ${roomType.room_type_id}`}
                  </option>
                ))}
              </CFormSelect>
            </div>

            <div className="d-flex align-items-center gap-2 mb-1">
              <IconOnlyButton
                icon={cilSave}
                tone="secondary"
                label="Save 7 Days"
                disabled={!selectedBulkRoomType || bulkSavingRoomTypeId !== null}
                onClick={() => selectedBulkRoomType && saveRoomTypeWeek(selectedBulkRoomType, false)}
              />
              <IconOnlyButton
                icon={cilCheckCircle}
                tone="danger"
                label="Fill Max 7 Days"
                disabled={!selectedBulkRoomType || bulkSavingRoomTypeId !== null}
                onClick={() => selectedBulkRoomType && saveRoomTypeWeek(selectedBulkRoomType, true)}
              />
              {bulkSavingRoomTypeId !== null && <CSpinner size="sm" />}
            </div>
          </div>
        )}

        <CTable bordered responsive className="align-middle text-nowrap">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Room Type</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Base Qty</CTableHeaderCell>
              {dateWindow.map((day) => (
                <CTableHeaderCell key={day.iso} className="text-center">
                  <div>{day.dayLabel}</div>
                  <small>{day.dateLabel}</small>
                </CTableHeaderCell>
              ))}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {roomTypes.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={dateWindow.length + 2} className="text-center">
                  No room types found for the selected property
                </CTableDataCell>
              </CTableRow>
            ) : (
              roomTypes.map((roomType) => (
                <CTableRow key={roomType.room_type_id}>
                  <CTableDataCell>
                    <div className="fw-semibold">{roomType.room_type_name || '-'}</div>
                    <small className="text-medium-emphasis">{roomType.room_type_code || '-'}</small>
                  </CTableDataCell>
                  <CTableDataCell className="text-center">{Number(roomType.room_qty || 0)}</CTableDataCell>
                  {dateWindow.map((day) => {
                    const cellKey = getCellKey(roomType.room_type_id, day.iso)
                    const isSaving = savingCellKey === cellKey
                    const maxUnits = getTotalUnitsForDay(roomType, day.iso)
                    const isZeroAvailability = String(cellInputs[cellKey] ?? '').trim() === '0'
                    const isBulkSavingRow = bulkSavingRoomTypeId === Number(roomType.room_type_id)

                    return (
                      <CTableDataCell key={cellKey} className="text-center">
                        <div className="d-inline-flex align-items-center gap-2">
                          <CFormInput
                            type="number"
                            min={0}
                            max={maxUnits}
                            value={cellInputs[cellKey] ?? ''}
                            style={{ width: '86px' }}
                            className={isZeroAvailability ? 'text-danger border-danger fw-semibold' : ''}
                            onChange={(e) =>
                              onCellInputChange(roomType.room_type_id, day.iso, e.target.value)
                            }
                            onBlur={() => saveCell(roomType, day)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                e.currentTarget.blur()
                              }
                            }}
                            disabled={isSaving || isBulkSavingRow}
                          />
                          {isSaving && <CSpinner size="sm" />}
                          {isBulkSavingRow && <CSpinner size="sm" />}
                        </div>
                      </CTableDataCell>
                    )
                  })}
                </CTableRow>
              ))
            )}

            <CTableRow>
              <CTableHeaderCell colSpan={2}>Bookings / Day</CTableHeaderCell>
              {dateWindow.map((day) => (
                <CTableDataCell key={`bookings-${day.iso}`} className="text-center">
                  <CBadge color="info">{Number(bookingsByDay[day.iso] || 0)}</CBadge>
                </CTableDataCell>
              ))}
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  )
}

export default BookingLocks
