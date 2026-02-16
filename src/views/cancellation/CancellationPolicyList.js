// src/views/cancellation/CancellationPolicyList.js
import React, { useEffect, useState } from 'react'
import { cilMagnifyingGlass, cilPencil, cilPlus, cilTrash } from '@coreui/icons'
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
  const [search, setSearch] = useState('')

  const loadPolicies = () => {
    fetch(`${API_BASE}/cancellation-policies?search=${search}`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => setPolicies(d.data || d))
  }

  useEffect(() => {
    loadPolicies()
  }, [])

  const handleSearch = () => {
    loadPolicies()
  }

  const deletePolicy = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return

    await fetch(`${API_BASE}/cancellation-policies/${id}`, {
      method: 'DELETE',
      headers: auth.getAuthHeader(),
    })

    loadPolicies()
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

        <CTable striped>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>ID</CTableHeaderCell>
              <CTableHeaderCell>Name</CTableHeaderCell>
              <CTableHeaderCell>Description</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {policies.map((p) => (
              <CTableRow key={p.id}>
                <CTableDataCell>{p.id}</CTableDataCell>
                <CTableDataCell>{p.name}</CTableDataCell>
                <CTableDataCell>{p.description}</CTableDataCell>

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
            ))}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  )
}

export default CancellationPolicyList
