import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormInput,
  CButton,
  CAlert,
  CRow,
  CCol,
} from '@coreui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'

const UserEdit = () => {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [userData, setUserData] = useState(null)
  const [error, setError] = useState('')

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
      })

      const data = await res.json()
      setUserData(data)
    } catch (err) {
      console.error(err)
      setError('User not found')
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(userData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Failed to update user')
        return
      }

      navigate('/users')
    } catch (err) {
      console.error(err)
      setError('Failed to update user')
    }
  }

  if (!userData) return <p>Loading...</p>

  return (
    <CCard>
      <CCardHeader>
        <h4>Edit User</h4>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          {/* Row 1 */}
          <CRow className="mb-3">
            <CCol md={4}>
              <CFormInput
                label="Full Name"
                value={userData.full_name || ''}
                onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
              />
            </CCol>

            <CCol md={4}>
              <CFormInput
                label="Email"
                type="email"
                value={userData.email || ''}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              />
            </CCol>

            <CCol md={4}>
              <CFormInput
                label="Phone"
                value={userData.phone || ''}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              />
            </CCol>
          </CRow>

          {/* Row 2 */}
          <CRow className="mb-3">
            <CCol md={4}>
              <CFormInput
                label="Role"
                value={userData.role || ''}
                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
              />
            </CCol>
          </CRow>

          <CButton color="primary" type="submit">
            Update User
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default UserEdit
