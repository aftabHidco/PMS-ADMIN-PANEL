// src/views/admins/AdminCreate.js
import React, { useState, useEffect } from 'react'
import {
  CCard, CCardHeader, CCardBody, CForm,
  CRow, CCol, CFormInput, CButton, CAlert, CFormSelect
} from '@coreui/react'
import axios from 'axios'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'

const AdminCreate = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    property_id: '',
  })

  const [error, setError] = useState('')
  const [properties, setProperties] = useState([])

  // Fetch property list
  useEffect(() => {
    fetch(`${API_BASE}/properties?_perPage=100`, {
      headers: {
        "Content-Type": "application/json",
        ...auth.getAuthHeader(),
      }
    })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data.data) ? data.data : data
        setProperties(list)
      })
      .catch(() => {
        setError("Failed to load properties")
      })
  }, [])

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // ⭐ THIS MATCHES YOUR BACKEND DTO EXACTLY ⭐
    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: "admin",                // required by backend
      property_id: form.property_id // required for admin users
    }

    try {
      const res = await fetch(`${API_BASE}/admin-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth.getAuthHeader() },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Failed to create admin user")
        return
      }

      navigate('/admins')
    } catch (err) {
      setError("Failed to create admin user")
    }
  }

  return (
    <CCard>
      <CCardHeader><h4>Create Admin User</h4></CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Full Name"
                className="mb-3"
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                required
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Email"
                type="email"
                className="mb-3"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Phone"
                className="mb-3"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Password"
                type="password"
                className="mb-3"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
              />
            </CCol>
          </CRow>

          {/* ---------- Property Dropdown ---------- */}
          <CRow>
            <CCol md={6}>
              <CFormSelect
                label="Property"
                className="mb-3"
                value={form.property_id}
                onChange={(e) => handleChange("property_id", e.target.value)}
                required
                >
                <option value="">Select Property</option>
                {properties.map((p) => (
                    <option key={p.property_id} value={p.property_id}>
                    {p.property_name}
                    </option>
                ))}
                </CFormSelect>

            </CCol>
          </CRow>

          <CButton color="primary" type="submit">Save Admin</CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default AdminCreate
