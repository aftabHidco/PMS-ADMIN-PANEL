// src/views/users/UserCreate.js
import React, { useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormInput,
  CButton,
  CAlert,
  CRow,
  CCol
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'

const UserCreate = () => {
  const auth = useAuth()
  const navigate = useNavigate()

  const API_BASE = auth.API_BASE

  const [full_name, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      full_name,
      email,
      phone,
      password,
    }

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to create user')
        return
      }

      navigate('/users')
    } catch (err) {
      console.error(err)
      setError('Failed to create user')
    }
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>Create User</h4>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          
          {/* Row 1 */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormInput
                label="Full Name"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </CCol>
          </CRow>

          {/* Row 2 */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormInput
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </CCol>
          </CRow>

          <CButton color="primary" type="submit">
            Save User
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default UserCreate
