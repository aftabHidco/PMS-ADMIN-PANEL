import React, { useEffect, useState } from 'react'
import { cilSave } from '@coreui/icons'
import { CCard, CCardHeader, CCardBody, CForm, CFormInput, CAlert, CRow, CCol } from '@coreui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import axios from 'axios'
import IconOnlyButton from '../../components/IconOnlyButton'

const RoleEdit = () => {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [role, setRole] = useState(null)
  const [error, setError] = useState('')
  const [ipAddress, setIpAddress] = useState('')

  const fetchRole = async () => {
    try {
      const res = await fetch(`${API_BASE}/roles/${id}`, {
        headers: auth.getAuthHeader(),
      })
      const data = await res.json()
      setRole(data)
    } catch (err) {
      console.error(err)
      setError('Role not found')
    }
  }

  const fetchIp = async () => {
    try {
      const response = await axios.get('https://api.ipify.org?format=json')
      setIpAddress(response.data.ip)
    } catch (err) {
      console.error('Error fetching IP address', err)
      setError('Could not fetch IP address')
    }
  }

  useEffect(() => {
    fetchRole()
    fetchIp()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const updatedBy = auth.user.user_id // Assuming user_id is available after login

    const roleData = {
      role_name: role.role_name,
      role_description: role.role_description,
      updated_by: updatedBy,
      ip_address: ipAddress,
    }

    try {
      const res = await fetch(`${API_BASE}/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(roleData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Failed to update role')
        return
      }

      navigate('/roles')
    } catch (err) {
      console.error(err)
      setError('Failed to update role')
    }
  }

  if (!role) return <p>Loading...</p>

  return (
    <CCard>
      <CCardHeader>
        <h4>Edit Role</h4>
      </CCardHeader>
      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Role Name"
                className="mb-3"
                value={role.role_name}
                onChange={(e) => setRole({ ...role, role_name: e.target.value })}
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Role Description"
                className="mb-3"
                value={role.role_description}
                onChange={(e) => setRole({ ...role, role_description: e.target.value })}
              />
            </CCol>
          </CRow>

          <div className="d-flex justify-content-end mt-2">
            <IconOnlyButton icon={cilSave} tone="primary" label="Update Role" type="submit" />
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default RoleEdit
