import React, { useEffect, useMemo, useState } from 'react'
import { cilChevronLeft, cilChevronRight, cilPencil, cilPlus, cilTrash } from '@coreui/icons'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
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
import { useLocation, useNavigate } from 'react-router-dom'
import IconOnlyButton from '../../components/IconOnlyButton'
import {
  getErrorMessage,
  getListData,
  getMasterRoomTypeId,
  readJsonSafely,
  toBooleanFlag,
} from './roomTypeMasterUtils'

const RoomTypeMasterList = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const API_BASE = auth.API_BASE

  const [masterRoomTypes, setMasterRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('room_type_name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const perPage = 10

  const loadMasterRoomTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/room-type-masters`, {
        headers: { ...auth.getAuthHeader() },
      })

      const data = await readJsonSafely(res)

      if (!res.ok) {
        throw new Error(getErrorMessage(data, 'Failed to load room type masters'))
      }

      setMasterRoomTypes(getListData(data))
    } catch (loadError) {
      console.error('Failed to load room type masters:', loadError)
      setError(loadError.message || 'Failed to load room type masters')
    }
  }

  useEffect(() => {
    loadMasterRoomTypes().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!location.state?.success) return

    setSuccess(location.state.success)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

  const filtered = useMemo(() => {
    return masterRoomTypes.filter((master) => {
      const text = `${master.room_type_name} ${master.room_type_code} ${master.description} ${
        toBooleanFlag(master.is_active) ? 'active' : 'inactive'
      }`.toLowerCase()
      return text.includes(search.toLowerCase())
    })
  }, [masterRoomTypes, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const normalize = (item) => {
        if (sortField === 'is_active') return toBooleanFlag(item?.is_active) ? 1 : 0

        const value = item?.[sortField]
        if (typeof value === 'number') return value

        return String(value || '').toLowerCase()
      }

      const left = normalize(a)
      const right = normalize(b)

      if (left === right) return 0
      return sortDir === 'asc' ? (left > right ? 1 : -1) : left < right ? 1 : -1
    })
  }, [filtered, sortDir, sortField])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const paginated = sorted.slice((page - 1) * perPage, page * perPage)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortField(field)
    setSortDir('asc')
  }

  const deleteMasterRoomType = async (masterRoomType) => {
    const masterRoomTypeId = getMasterRoomTypeId(masterRoomType)
    const masterRoomTypeName = masterRoomType?.room_type_name || 'this room type master'

    if (!masterRoomTypeId) return
    if (!window.confirm(`Delete ${masterRoomTypeName}?`)) return

    setError('')
    setSuccess('')

    try {
      const res = await fetch(`${API_BASE}/room-type-masters/${masterRoomTypeId}`, {
        method: 'DELETE',
        headers: { ...auth.getAuthHeader() },
      })

      const data = await readJsonSafely(res)

      if (!res.ok) {
        setError(getErrorMessage(data, 'Failed to delete room type master'))
        return
      }

      setSuccess('Room type master deleted successfully.')
      await loadMasterRoomTypes()
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete room type master')
    }
  }

  if (loading) return <CSpinner className="m-4" />

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>Room Type Masters</h4>
        <IconOnlyButton
          icon={cilPlus}
          tone="primary"
          label="Add Room Type Master"
          onClick={() => navigate('/room-type-masters/create')}
        />
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}
        {success && <CAlert color="success">{success}</CAlert>}

        <CFormInput
          placeholder="Search room type masters..."
          className="mb-3"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />

        <CTable bordered hover responsive>
          <CTableHead color="dark">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell onClick={() => handleSort('room_type_name')}>
                Room Type Master {sortField === 'room_type_name' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>
              <CTableHeaderCell onClick={() => handleSort('room_type_code')}>
                Code {sortField === 'room_type_code' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>
              <CTableHeaderCell>Occupancy</CTableHeaderCell>
              <CTableHeaderCell onClick={() => handleSort('is_active')}>
                Status {sortField === 'is_active' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>
              <CTableHeaderCell>Description</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {paginated.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={7} className="text-center">
                  No room type masters found
                </CTableDataCell>
              </CTableRow>
            ) : (
              paginated.map((masterRoomType, index) => (
                <CTableRow key={getMasterRoomTypeId(masterRoomType) || index}>
                  <CTableDataCell>{(page - 1) * perPage + index + 1}</CTableDataCell>
                  <CTableDataCell>{masterRoomType.room_type_name || '-'}</CTableDataCell>
                  <CTableDataCell>{masterRoomType.room_type_code || '-'}</CTableDataCell>
                  <CTableDataCell>
                    {masterRoomType.base_occupancy || '-'} / {masterRoomType.max_occupancy || '-'}
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={toBooleanFlag(masterRoomType.is_active) ? 'success' : 'secondary'}>
                      {toBooleanFlag(masterRoomType.is_active) ? 'Active' : 'Inactive'}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{masterRoomType.description || '-'}</CTableDataCell>
                  <CTableDataCell>
                    <IconOnlyButton
                      icon={cilPencil}
                      tone="info"
                      size="sm"
                      className="me-2"
                      label="Edit Room Type Master"
                      onClick={() =>
                        navigate(`/room-type-masters/${getMasterRoomTypeId(masterRoomType)}/edit`)
                      }
                    />

                    <IconOnlyButton
                      icon={cilTrash}
                      tone="danger"
                      size="sm"
                      label="Delete Room Type Master"
                      onClick={() => deleteMasterRoomType(masterRoomType)}
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

export default RoomTypeMasterList
