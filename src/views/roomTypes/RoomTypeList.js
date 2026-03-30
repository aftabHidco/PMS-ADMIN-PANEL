// src/views/roomTypes/RoomTypeList.js
import React, { useEffect, useMemo, useState } from 'react'
import { cilChevronLeft, cilChevronRight, cilPencil, cilPlus, cilTrash } from '@coreui/icons'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CAlert,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormInput,
} from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import IconOnlyButton from '../../components/IconOnlyButton'

const RoomTypeList = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [roomTypes, setRoomTypes] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('room_type_name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const perPage = 10

  const loadProperties = async () => {
    try {
      const res = await fetch(`${API_BASE}/properties?_perPage=500`, {
        headers: { ...auth.getAuthHeader() },
      })
      const data = await res.json()
      setProperties(data?.data || data)
    } catch (err) {
      console.error('Failed to load properties')
    }
  }

  const loadRoomTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/room-types?_perPage=500`, {
        headers: { ...auth.getAuthHeader() },
      })

      const data = await res.json()
      setRoomTypes(data?.data || data)
    } catch (err) {
      console.error('Failed to load room types')
      setError('Failed to load room types')
    }
  }

  useEffect(() => {
    Promise.all([loadProperties(), loadRoomTypes()]).finally(() => setLoading(false))
  }, [])

  const propertyMap = useMemo(() => {
    const map = {}
    properties.forEach((p) => {
      map[p.property_id] = p.property_name
    })
    return map
  }, [properties])

  const getPropertyName = (id) => propertyMap[id] || '-'

  const filtered = useMemo(() => {
    return roomTypes.filter((rt) => {
      const text = `${rt.room_type_name} ${rt.room_type_code} ${getPropertyName(
        rt.property_id,
      )} ${rt.master_room_type_id || ''}`.toLowerCase()
      return text.includes(search.toLowerCase())
    })
  }, [search, roomTypes, propertyMap])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let A = (a[sortField] || '').toString().toLowerCase()
      let B = (b[sortField] || '').toString().toLowerCase()
      return sortDir === 'asc' ? (A > B ? 1 : -1) : A < B ? 1 : -1
    })
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const paginated = sorted.slice((page - 1) * perPage, page * perPage)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const deleteRoomType = async (id) => {
    if (!window.confirm('Delete this room type?')) return

    const res = await fetch(`${API_BASE}/room-types/${id}`, {
      method: 'DELETE',
      headers: { ...auth.getAuthHeader() },
    })

    if (!res.ok) {
      alert('Failed to delete')
      return
    }

    loadRoomTypes()
  }

  if (loading) return <CSpinner className="m-4" />

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>Room Types</h4>
        <IconOnlyButton
          icon={cilPlus}
          tone="primary"
          label="Add Room Type"
          onClick={() => navigate('/room-types/create')}
        />
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CFormInput
          placeholder="Search room types..."
          className="mb-3"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />

        <CTable bordered hover responsive>
          <CTableHead color="dark">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>

              <CTableHeaderCell onClick={() => handleSort('room_type_name')}>
                Room Type {sortField === 'room_type_name' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>

              <CTableHeaderCell onClick={() => handleSort('room_type_code')}>
                Code {sortField === 'room_type_code' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>

              <CTableHeaderCell onClick={() => handleSort('master_room_type_id')}>
                Master ID {sortField === 'master_room_type_id' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>
              <CTableHeaderCell>Property</CTableHeaderCell>
              <CTableHeaderCell>Occupancy</CTableHeaderCell>
              <CTableHeaderCell>Qty</CTableHeaderCell>
              <CTableHeaderCell>Inventory Mode</CTableHeaderCell>

              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {paginated.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={9} className="text-center">
                  No room types found
                </CTableDataCell>
              </CTableRow>
            ) : (
              paginated.map((rt, index) => (
                <CTableRow key={rt.room_type_id}>
                  <CTableDataCell>{(page - 1) * perPage + index + 1}</CTableDataCell>
                  <CTableDataCell>{rt.room_type_name}</CTableDataCell>
                  <CTableDataCell>{rt.room_type_code || '-'}</CTableDataCell>
                  <CTableDataCell>{rt.master_room_type_id || '-'}</CTableDataCell>
                  <CTableDataCell>{getPropertyName(rt.property_id)}</CTableDataCell>
                  <CTableDataCell>
                    {rt.base_occupancy} / {rt.max_occupancy}
                  </CTableDataCell>
                  <CTableDataCell>{rt.qty}</CTableDataCell>
                  <CTableDataCell>{rt.inventory_mode}</CTableDataCell>

                  <CTableDataCell>
                    <IconOnlyButton
                      icon={cilPencil}
                      tone="info"
                      size="sm"
                      className="me-2"
                      label="Edit Room Type"
                      onClick={() => navigate(`/room-types/${rt.room_type_id}/edit/`)}
                    />

                    <IconOnlyButton
                      icon={cilTrash}
                      tone="danger"
                      size="sm"
                      label="Delete Room Type"
                      onClick={() => deleteRoomType(rt.room_type_id)}
                    />
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>

        <div className="d-flex justify-content-between mt-3">
          <IconOnlyButton
            icon={cilChevronLeft}
            label="Previous Page"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          />

          <span>
            Page {page} of {totalPages}
          </span>

          <IconOnlyButton
            icon={cilChevronRight}
            label="Next Page"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          />
        </div>
      </CCardBody>
    </CCard>
  )
}

export default RoomTypeList
