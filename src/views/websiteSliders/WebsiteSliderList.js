import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  cilChevronLeft,
  cilChevronRight,
  cilMagnifyingGlass,
  cilPencil,
  cilPlus,
  cilReload,
  cilTrash,
} from '@coreui/icons'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CToaster,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppToast from '../../components/AppToast'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'
import SuperAdminOnly from '../../components/SuperAdminOnly'
import WebsiteSliderImagePreview from './WebsiteSliderImagePreview'
import {
  formatWebsiteSliderDateTime,
  getApiErrorMessage,
  hasWebsiteSliderApiError,
  normalizeWebsiteSliderCollectionResponse,
  parseJsonSafely,
} from './websiteSliderUtils'

const PER_PAGE = 10

const WebsiteSliderList = () => {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [sliders, setSliders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [sortField, setSortField] = useState('display_order')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState(0)
  const toaster = useRef()

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total])

  const pushToast = useCallback((message, color = 'success', title = 'Website Sliders') => {
    if (!message) return

    setToast(<AppToast color={color} title={title} message={message} />)
  }, [])

  const loadSliders = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        _page: String(page),
        _perPage: String(PER_PAGE),
        _sortField: sortField,
        _sortDir: sortDir,
      })

      const filter = {}
      if (appliedSearch) {
        filter.q = appliedSearch
      }
      if (activeFilter !== '') {
        filter.is_active = activeFilter === 'true'
        params.set('is_active', activeFilter)
      }
      if (Object.keys(filter).length) {
        params.set('filter', JSON.stringify(filter))
      }

      const response = await fetch(`${API_BASE}/website-sliders?${params.toString()}`, {
        headers: { ...auth.getAuthHeader() },
      })
      const payload = await parseJsonSafely(response)

      if (response.status === 403) {
        throw new Error('You do not have permission to access Website Sliders.')
      }

      if (!response.ok || hasWebsiteSliderApiError(payload)) {
        throw new Error(getApiErrorMessage(payload, 'Failed to load website sliders'))
      }

      const normalized = normalizeWebsiteSliderCollectionResponse(payload)
      setSliders(normalized.data)
      setTotal(normalized.total)
    } catch (err) {
      setSliders([])
      setTotal(0)
      setError(err.message || 'Failed to load website sliders')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, activeFilter, appliedSearch, auth, page, sortDir, sortField])

  useEffect(() => {
    loadSliders()
  }, [loadSliders])

  useEffect(() => {
    const toastState = location.state?.toast
    if (!toastState?.message) return

    pushToast(toastState.message, toastState.color, toastState.title)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate, pushToast])

  const handleSearch = () => {
    const nextSearch = search.trim()
    if (nextSearch === appliedSearch) {
      loadSliders()
      return
    }

    setPage(1)
    setAppliedSearch(nextSearch)
  }

  const handleResetFilters = () => {
    setSearch('')
    setAppliedSearch('')
    setActiveFilter('')
    setSortField('display_order')
    setSortDir('asc')
    setPage(1)
  }

  const handleSort = (field) => {
    setPage(1)
    if (sortField === field) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortField(field)
    setSortDir('asc')
  }

  const handleDelete = async (slider) => {
    const label = slider?.title ? `"${slider.title}"` : `#${slider?.slider_id}`
    if (!window.confirm(`Delete website slider ${label}?`)) return

    try {
      const response = await fetch(`${API_BASE}/website-sliders/${slider.slider_id}`, {
        method: 'DELETE',
        headers: { ...auth.getAuthHeader() },
      })
      const payload = await parseJsonSafely(response)

      if (response.status === 403) {
        throw new Error('You do not have permission to delete Website Sliders.')
      }

      if (!response.ok || hasWebsiteSliderApiError(payload)) {
        throw new Error(getApiErrorMessage(payload, 'Failed to delete website slider'))
      }

      pushToast(payload?.message || 'Website slider deleted successfully.')

      if (sliders.length === 1 && page > 1) {
        setPage((current) => current - 1)
        return
      }

      loadSliders()
    } catch (err) {
      setError(err.message || 'Failed to delete website slider')
    }
  }

  return (
    <SuperAdminOnly message="Website Sliders are available to super admins only.">
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Website Sliders</h4>
          <IconOnlyButton
            icon={cilPlus}
            tone="primary"
            label="Add Website Slider"
            onClick={() => navigate('/website-sliders/create')}
          />
        </CCardHeader>

        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          <CToaster ref={toaster} push={toast} placement="top-end" />

          <CRow className="mb-3 g-3 align-items-end">
            <CCol md={5}>
              <CFormInput
                label="Search"
                placeholder="Search title, subtitle, redirect URL..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearch()
                  }
                }}
              />
            </CCol>

            <CCol md={3}>
              <CFormSelect
                label="Status"
                value={activeFilter}
                onChange={(event) => {
                  setActiveFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </CFormSelect>
            </CCol>

            <CCol md={4} className="d-flex" style={{ gap: 8 }}>
              <IconOnlyButton
                icon={cilMagnifyingGlass}
                tone="info"
                label="Search Website Sliders"
                onClick={handleSearch}
              />
              <IconOnlyButton
                icon={cilReload}
                tone="secondary"
                label="Reset Filters"
                onClick={handleResetFilters}
              />
            </CCol>
          </CRow>

          <div className="mb-3">
            <strong>Total:</strong> {total}
          </div>

          <CTable bordered hover responsive>
            <CTableHead color="dark">
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Preview</CTableHeaderCell>
                <CTableHeaderCell
                  role="button"
                  onClick={() => handleSort('title')}
                  style={{ cursor: 'pointer' }}
                >
                  Title {sortField === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
                </CTableHeaderCell>
                <CTableHeaderCell>Redirect URL</CTableHeaderCell>
                <CTableHeaderCell
                  role="button"
                  onClick={() => handleSort('display_order')}
                  style={{ cursor: 'pointer' }}
                >
                  Order {sortField === 'display_order' && (sortDir === 'asc' ? '↑' : '↓')}
                </CTableHeaderCell>
                <CTableHeaderCell
                  role="button"
                  onClick={() => handleSort('is_active')}
                  style={{ cursor: 'pointer' }}
                >
                  Status {sortField === 'is_active' && (sortDir === 'asc' ? '↑' : '↓')}
                </CTableHeaderCell>
                <CTableHeaderCell
                  role="button"
                  onClick={() => handleSort('created_at')}
                  style={{ cursor: 'pointer' }}
                >
                  Created {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                </CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={8} className="text-center py-4">
                    <CSpinner color="primary" />
                  </CTableDataCell>
                </CTableRow>
              ) : sliders.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={8} className="text-center">
                    No website sliders found
                  </CTableDataCell>
                </CTableRow>
              ) : (
                sliders.map((slider, index) => (
                  <CTableRow key={slider.slider_id}>
                    <CTableDataCell>{(page - 1) * PER_PAGE + index + 1}</CTableDataCell>
                    <CTableDataCell style={{ minWidth: 120 }}>
                      <WebsiteSliderImagePreview
                        src={slider.image_url}
                        apiBase={API_BASE}
                        alt={slider.title || `Website slider ${slider.slider_id}`}
                        width={96}
                        height={56}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{slider.title || '-'}</CTableDataCell>
                    <CTableDataCell style={{ minWidth: 220 }}>
                      {slider.redirect_url ? (
                        <a href={slider.redirect_url} target="_blank" rel="noreferrer">
                          {slider.redirect_url}
                        </a>
                      ) : (
                        '-'
                      )}
                    </CTableDataCell>
                    <CTableDataCell>{Number(slider.display_order ?? 0)}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={slider.is_active ? 'success' : 'secondary'}>
                        {slider.is_active ? 'Active' : 'Inactive'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{formatWebsiteSliderDateTime(slider.created_at)}</CTableDataCell>
                    <CTableDataCell>
                      <IconOnlyButton
                        icon={cilPencil}
                        tone="info"
                        size="sm"
                        className="me-2"
                        label="Edit Website Slider"
                        onClick={() => navigate(`/website-sliders/${slider.slider_id}/edit`)}
                      />
                      <IconOnlyButton
                        icon={cilTrash}
                        tone="danger"
                        size="sm"
                        label="Delete Website Slider"
                        onClick={() => handleDelete(slider)}
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
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            />

            <span>
              Page {Math.min(page, totalPages)} of {totalPages}
            </span>

            <IconOnlyButton
              icon={cilChevronRight}
              label="Next Page"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </div>
        </CCardBody>
      </CCard>
    </SuperAdminOnly>
  )
}

export default WebsiteSliderList
