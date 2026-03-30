// src/views/properties/PropertyList.js
import React, { useEffect, useMemo, useState } from 'react'
import { cilChevronLeft, cilChevronRight, cilPencil, cilPlus } from '@coreui/icons'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CFormInput,
  CAlert,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const PropertyList = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search, sorting, pagination
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('property_name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const perPage = 10

  // ------------------------------------------------------------
  // Fetch Properties
  // ------------------------------------------------------------
  const loadProperties = async () => {
    try {
      const res = await fetch(`${API_BASE}/properties?_perPage=500`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })

      const data = await res.json()
      setProperties(data?.data || data)
    } catch (err) {
      console.error('Failed to load properties:', err)
      setError('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProperties()
  }, [])

  // ------------------------------------------------------------
  // Build Combined Address (handles missing fields)
  // ------------------------------------------------------------
  const buildAddress = (p) => {
    return [p.address, p.city, p.state, p.country, p.pincode || p.zip || p.postal_code]
      .filter(Boolean) // Remove null/undefined/empty strings
      .join(', ')
  }

  const isAutoAcceptEnabled = (p) =>
    p?.auto_accept_enabled === true ||
    p?.auto_accept_enabled === 1 ||
    p?.auto_accept_enabled === '1' ||
    p?.auto_accept_enabled === 'true'

  // ------------------------------------------------------------
  // Search
  // ------------------------------------------------------------
  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const text = `${p.property_name} ${p.property_code} ${buildAddress(p)}`.toLowerCase()
      return text.includes(search.toLowerCase())
    })
  }, [search, properties])

  // ------------------------------------------------------------
  // Sort
  // ------------------------------------------------------------
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let A = a[sortField] || ''
      let B = b[sortField] || ''

      A = A.toString().toLowerCase()
      B = B.toString().toLowerCase()

      return sortDir === 'asc' ? (A > B ? 1 : -1) : A < B ? 1 : -1
    })
  }, [filtered, sortField, sortDir])

  // ------------------------------------------------------------
  // Pagination
  // ------------------------------------------------------------
  const totalPages = Math.ceil(sorted.length / perPage)
  const paginated = sorted.slice((page - 1) * perPage, page * perPage)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // ------------------------------------------------------------
  // UI Rendering
  // ------------------------------------------------------------
  if (loading)
    return (
      <div className="text-center my-4">
        <CSpinner color="primary" />
      </div>
    )

  return (
    <CCard>
      <CCardHeader>
        <h4 className="d-flex justify-content-between align-items-center">
          Properties
          <IconOnlyButton
            icon={cilPlus}
            tone="primary"
            label="Add Property"
            onClick={() => navigate('/properties/create')}
          />
        </h4>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CFormInput
          placeholder="Search property name, code, address..."
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

              <CTableHeaderCell onClick={() => handleSort('property_name')}>
                Name {sortField === 'property_name' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>

              <CTableHeaderCell onClick={() => handleSort('property_code')}>
                Code {sortField === 'property_code' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>

              <CTableHeaderCell>Address</CTableHeaderCell>
              <CTableHeaderCell>Auto Accept</CTableHeaderCell>
              <CTableHeaderCell>Interval (mins)</CTableHeaderCell>

              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {paginated.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={7} className="text-center">
                  No properties found
                </CTableDataCell>
              </CTableRow>
            ) : (
              paginated.map((p, index) => (
                <CTableRow key={p.property_id}>
                  <CTableDataCell>{(page - 1) * perPage + index + 1}</CTableDataCell>

                  <CTableDataCell>{p.property_name}</CTableDataCell>
                  <CTableDataCell>{p.property_code || '-'}</CTableDataCell>

                  <CTableDataCell>{buildAddress(p)}</CTableDataCell>
                  <CTableDataCell>{isAutoAcceptEnabled(p) ? 'ON' : 'OFF'}</CTableDataCell>
                  <CTableDataCell>
                    {isAutoAcceptEnabled(p)
                      ? Number(p?.auto_accept_interval_minutes || 0) || '-'
                      : '-'}
                  </CTableDataCell>

                  <CTableDataCell>
                    <IconOnlyButton
                      icon={cilPencil}
                      tone="info"
                      size="sm"
                      label="Edit Property"
                      onClick={() => navigate(`/properties/${p.property_id}/edit`)}
                    />
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>

        {/* Pagination */}
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

export default PropertyList
