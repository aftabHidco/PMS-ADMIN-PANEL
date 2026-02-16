import React, { useEffect, useState } from 'react'
import { cilPencil, cilPlus, cilTrash } from '@coreui/icons'
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
} from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import IconOnlyButton from '../../components/IconOnlyButton'

const RoleList = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [roles, setRoles] = useState([])

  // Fetch roles data from the API
  const fetchRoles = async () => {
    const res = await fetch(`${API_BASE}/roles`, { headers: auth.getAuthHeader() })
    const data = await res.json()

    // Correctly set the roles data from the API response
    setRoles(data.data || []) // Using 'data' field from API response
  }

  // Delete a role
  const deleteRole = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return
    await fetch(`${API_BASE}/roles/${id}`, {
      method: 'DELETE',
      headers: auth.getAuthHeader(),
    })
    fetchRoles()
  }

  // Fetch roles when the component mounts
  useEffect(() => {
    fetchRoles()
  }, [])

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>Roles</h4>
        <IconOnlyButton
          icon={cilPlus}
          tone="primary"
          label="Create Role"
          onClick={() => navigate('/roles/create')}
        />
      </CCardHeader>

      <CCardBody>
        <CTable hover>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>ID</CTableHeaderCell>
              <CTableHeaderCell>Role Name</CTableHeaderCell>
              <CTableHeaderCell>Description</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {roles.map((role) => (
              <CTableRow key={role.role_id}>
                <CTableDataCell>{role.role_id}</CTableDataCell>
                <CTableDataCell>{role.role_name}</CTableDataCell>
                <CTableDataCell>{role.role_description}</CTableDataCell>{' '}
                {/* Displaying description */}
                <CTableDataCell>
                  <IconOnlyButton
                    icon={cilPencil}
                    tone="info"
                    size="sm"
                    className="me-2"
                    label="Edit Role"
                    onClick={() => navigate(`/roles/${role.role_id}/edit`)}
                  />
                  <IconOnlyButton
                    icon={cilTrash}
                    tone="danger"
                    size="sm"
                    label="Delete Role"
                    onClick={() => deleteRole(role.role_id)}
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

export default RoleList
