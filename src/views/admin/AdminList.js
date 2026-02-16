// src/views/admins/AdminList.js
import React, { useEffect, useMemo, useState } from 'react'
import { cilChevronLeft, cilChevronRight, cilPencil, cilPlus, cilTrash } from '@coreui/icons'
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
  CAlert,
  CSpinner,
  CFormInput,
} from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import IconOnlyButton from '../../components/IconOnlyButton'

const AdminList = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [admins, setAdmins] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 🔍 Search and sorting states
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('full_name')
  const [sortDir, setSortDir] = useState('asc')

  // 📄 Pagination
  const [page, setPage] = useState(1)
  const perPage = 10

  // ------------------------------------------------------------
  // Fetch Admin Users
  // ------------------------------------------------------------
  const loadAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin-users`, {
        headers: { 'Content-Type': 'application/json', ...auth.getAuthHeader() },
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed to load admin list')
        return
      }

      setAdmins(data?.data || data) // Supports both formats
    } catch (err) {
      setError('Failed to load admin list')
    }
  }

  // ------------------------------------------------------------
  // Fetch Properties (Used for Displaying Property Name)
  // ------------------------------------------------------------
  const loadProperties = async () => {
    try {
      const res = await fetch(`${API_BASE}/properties?_perPage=500`, {
        headers: { 'Content-Type': 'application/json', ...auth.getAuthHeader() },
      })
      const data = await res.json()
      setProperties(Array.isArray(data.data) ? data.data : data)
    } catch (err) {
      console.error('Failed to load properties')
    }
  }

  // ------------------------------------------------------------
  // Load Data on Mount
  // ------------------------------------------------------------
  useEffect(() => {
    Promise.all([loadAdmins(), loadProperties()]).finally(() => setLoading(false))
  }, [])

  // ------------------------------------------------------------
  // Precompute property lookup map for faster rendering
  // ------------------------------------------------------------
  const propertyMap = useMemo(() => {
    const map = {}
    properties.forEach((p) => {
      map[p.property_id] = p.property_name
    })
    return map
  }, [properties])

  const getPropertyName = (id) => propertyMap[id] || '-'

  // ------------------------------------------------------------
  // Searching Logic
  // ------------------------------------------------------------
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const text =
        `${admin.full_name} ${admin.email} ${admin.phone} ${getPropertyName(admin.property_id)}`.toLowerCase()
      return text.includes(search.toLowerCase())
    })
  }, [admins, search])

  // ------------------------------------------------------------
  // Sorting Logic
  // ------------------------------------------------------------
  const sortedAdmins = useMemo(() => {
    return [...filteredAdmins].sort((a, b) => {
      let A = a[sortField] || ''
      let B = b[sortField] || ''

      if (typeof A === 'string') A = A.toLowerCase()
      if (typeof B === 'string') B = B.toLowerCase()

      if (sortDir === 'asc') return A > B ? 1 : -1
      return A < B ? 1 : -1
    })
  }, [filteredAdmins, sortField, sortDir])

  // ------------------------------------------------------------
  // Pagination Logic
  // ------------------------------------------------------------
  const totalPages = Math.ceil(sortedAdmins.length / perPage)
  const paginatedAdmins = sortedAdmins.slice((page - 1) * perPage, page * perPage)

  // ------------------------------------------------------------
  // Delete Admin
  // ------------------------------------------------------------
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return

    try {
      const res = await fetch(`${API_BASE}/admin-users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...auth.getAuthHeader() },
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Failed to delete admin')
        return
      }

      loadAdmins()
    } catch (err) {
      alert('Failed to delete admin')
    }
  }

  // ------------------------------------------------------------
  // Table Sort Handler
  // ------------------------------------------------------------
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
          Admin Users
          <IconOnlyButton
            icon={cilPlus}
            tone="primary"
            label="Add Admin"
            onClick={() => navigate('/admins/create')}
          />
        </h4>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        {/* 🔍 Search Bar */}
        <CFormInput
          placeholder="Search by name, email, phone, property..."
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
              <CTableHeaderCell onClick={() => handleSort('full_name')}>
                Full Name {sortField === 'full_name' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>
              <CTableHeaderCell onClick={() => handleSort('email')}>
                Email {sortField === 'email' && (sortDir === 'asc' ? '↑' : '↓')}
              </CTableHeaderCell>
              <CTableHeaderCell>Phone</CTableHeaderCell>
              <CTableHeaderCell>Property</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {paginatedAdmins.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={6} className="text-center">
                  No admin users found
                </CTableDataCell>
              </CTableRow>
            ) : (
              paginatedAdmins.map((admin, index) => (
                <CTableRow key={admin.user_id}>
                  <CTableDataCell>{(page - 1) * perPage + index + 1}</CTableDataCell>
                  <CTableDataCell>{admin.full_name}</CTableDataCell>
                  <CTableDataCell>{admin.email}</CTableDataCell>
                  <CTableDataCell>{admin.phone || '-'}</CTableDataCell>
                  <CTableDataCell>{getPropertyName(admin.property_id)}</CTableDataCell>

                  <CTableDataCell>
                    <IconOnlyButton
                      icon={cilPencil}
                      tone="info"
                      size="sm"
                      className="me-2"
                      label="Edit Admin"
                      onClick={() => navigate(`/admins/${admin.user_id}/edit`)}
                    />

                    <IconOnlyButton
                      icon={cilTrash}
                      tone="danger"
                      size="sm"
                      label="Delete Admin"
                      onClick={() => handleDelete(admin.user_id)}
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

export default AdminList
