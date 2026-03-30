// src/views/cancellation/CancellationPolicyList.js
import React, { useCallback, useEffect, useState } from 'react'
import { cilMagnifyingGlass, cilPencil, cilPlus, cilTrash } from '@coreui/icons'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CFormInput,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const CancellationPolicyList = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [policies, setPolicies] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-IN', { hour12: true })
  }

  const loadPolicies = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (appliedSearch) params.set('search', appliedSearch)

      const query = params.toString()
      const res = await fetch(`${API_BASE}/cancellation-policies${query ? `?${query}` : ''}`, {
        headers: auth.getAuthHeader(),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(body?.message || body?.error || 'Failed to load cancellation policies')
      }

      const items = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
      setPolicies(items)
      setTotal(Number(body?.total ?? items.length))
    } catch (err) {
      setPolicies([])
      setTotal(0)
      setError(err.message || 'Failed to load cancellation policies')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, appliedSearch, auth])

  useEffect(() => {
    loadPolicies()
  }, [loadPolicies])

  const handleSearch = () => {
    const nextSearch = search.trim()
    if (nextSearch === appliedSearch) {
      loadPolicies()
      return
    }
    setAppliedSearch(nextSearch)
  }

  const deletePolicy = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return

    try {
      const res = await fetch(`${API_BASE}/cancellation-policies/${id}`, {
        method: 'DELETE',
        headers: auth.getAuthHeader(),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.message || body?.error || 'Failed to delete policy')
      }
      loadPolicies()
    } catch (err) {
      setError(err.message || 'Failed to delete policy')
    }
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>Cancellation Policies</h4>
        <IconOnlyButton
          icon={cilPlus}
          tone="primary"
          label="Create Policy"
          onClick={() => navigate('/cancellation/create')}
        />
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <div className="d-flex mb-3" style={{ gap: 10 }}>
          <CFormInput
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <IconOnlyButton
            icon={cilMagnifyingGlass}
            tone="info"
            label="Search Policies"
            onClick={handleSearch}
          />
        </div>

        <div className="mb-2">
          <strong>Total:</strong> {total}
        </div>

        <CTable striped>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Name</CTableHeaderCell>
              <CTableHeaderCell>Deduction (%)</CTableHeaderCell>
              <CTableHeaderCell>Refund Window (Days)</CTableHeaderCell>
              <CTableHeaderCell>Applies On Status</CTableHeaderCell>
              <CTableHeaderCell>Created</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {loading ? (
              <CTableRow>
                <CTableDataCell colSpan={6} className="text-center py-4">
                  <CSpinner color="primary" />
                </CTableDataCell>
              </CTableRow>
            ) : policies.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={6} className="text-center">
                  No cancellation policies found
                </CTableDataCell>
              </CTableRow>
            ) : (
              policies.map((p) => (
                <CTableRow key={p.id}>
                  <CTableDataCell>{p.name || '-'}</CTableDataCell>
                  <CTableDataCell>{p.deduction_percentage ?? '-'}</CTableDataCell>
                  <CTableDataCell>{p?.rules?.refund_window_days ?? '-'}</CTableDataCell>
                  <CTableDataCell>
                    {Array.isArray(p?.rules?.applies_on_booking_status) &&
                    p.rules.applies_on_booking_status.length > 0
                      ? p.rules.applies_on_booking_status.join(', ')
                      : '-'}
                  </CTableDataCell>
                  <CTableDataCell>{formatDateTime(p.created_at)}</CTableDataCell>
                  <CTableDataCell>
                    <IconOnlyButton
                      icon={cilPencil}
                      tone="info"
                      size="sm"
                      className="me-2"
                      label="Edit Policy"
                      onClick={() => navigate(`/cancellation/${p.id}/edit`)}
                    />

                    <IconOnlyButton
                      icon={cilTrash}
                      tone="danger"
                      size="sm"
                      label="Delete Policy"
                      onClick={() => deletePolicy(p.id)}
                    />
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  )
}

export default CancellationPolicyList
