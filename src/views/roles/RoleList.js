import React, { useEffect, useState } from 'react'
import {
  CCard, CCardHeader, CCardBody,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CButton
} from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'

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
    setRoles(data.data || [])  // Using 'data' field from API response
  }

  // Delete a role
  const deleteRole = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return
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
        <CButton color="primary" onClick={() => navigate('/roles/create')}>
          Create Role
        </CButton>
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
                <CTableDataCell>{role.role_description}</CTableDataCell> {/* Displaying description */}
                <CTableDataCell>
                  <CButton
                    color="info"
                    size="sm"
                    className="me-2"
                    onClick={() => navigate(`/roles/${role.role_id}/edit`)}
                  >
                    Edit
                  </CButton>
                  <CButton color="danger" size="sm" onClick={() => deleteRole(role.role_id)}>
                    Delete
                  </CButton>
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
