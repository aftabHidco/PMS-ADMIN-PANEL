import React, { useState, useEffect } from 'react'
import {
  CCard, CCardHeader, CCardBody,
  CForm, CFormInput, CButton, CAlert, CRow, CCol
} from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const RoleCreate = () => {
  const auth = useAuth()
  const API_BASE = auth.API_BASE
  const navigate = useNavigate()

  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [error, setError] = useState('')
  const [ipAddress, setIpAddress] = useState('')

  // Get dynamic IP address on component mount
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await axios.get('https://api.ipify.org?format=json')
        setIpAddress(response.data.ip)
      } catch (err) {
        console.error('Error fetching IP address', err)
        setError('Could not fetch IP address')
      }
    }

    fetchIp()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const createdBy = auth.user.user_id // Assuming user_id is available after login
    const updatedBy = auth.user.user_id // Same as createdBy, unless specified

    const roleData = {
      role_name: roleName,
      role_description: roleDescription,
      created_by: createdBy,
      updated_by: updatedBy,
      ip_address: ipAddress,
    }

    try {
      const res = await fetch(`${API_BASE}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(roleData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Failed to create role')
        return
      }

      navigate('/roles') // Redirect after success
    } catch (err) {
      console.error(err)
      setError('Failed to create role')
    }
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>Create Role</h4>
      </CCardHeader>
      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Role Name"
                className="mb-3"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Role Description"
                className="mb-3"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                required
              />
            </CCol>
          </CRow>

          <CButton color="primary" type="submit">
            Save Role
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default RoleCreate
