// src/views/admins/AdminEdit.js
import React, { useEffect, useState } from 'react'
import {
  CCard, CCardHeader, CCardBody, CForm,
  CRow, CCol, CFormInput, CButton, CAlert, CFormSelect
} from '@coreui/react'
import axios from 'axios'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate, useParams } from 'react-router-dom'

const AdminEdit = () => {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [form, setForm] = useState(null)
  const [error, setError] = useState("")
  const [properties, setProperties] = useState([])
  const [ip, setIp] = useState("")

  // ------------------------------
  // Load IP + Admin + Properties
  // ------------------------------
  useEffect(() => {
    axios.get("https://api.ipify.org?format=json")
      .then(res => setIp(res.data.ip))

    // Load admin user
    fetch(`${API_BASE}/admin-users/${id}`, { headers: auth.getAuthHeader() })
      .then(res => res.json())
      .then(data => {
        console.log("ADMIN EDIT RAW RESPONSE =", data)

        let user = data

        if (data?.data) user = data.data   // API returns {data: {...}}
        if (Array.isArray(data)) user = data[0]  // API returns [{...}]

        setForm(user)
      })
      .catch(() => setError("Failed to load admin"))
  }, [])

  // Load property list
  useEffect(() => {
    fetch(`${API_BASE}/properties?_perPage=200`, {
      headers: {
        "Content-Type": "application/json",
        ...auth.getAuthHeader()
      }
    })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data.data) ? data.data : data
        setProperties(list)
      })
      .catch(() => console.log("Failed to load properties"))
  }, [])

  // ------------------------------
  // Handle form updates
  // ------------------------------
  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  // ------------------------------
  // Submit updated admin
  // ------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      role: "admin",
      property_id: form.property_id, // cannot change, but sent back
      updated_by: auth.user.user_id,
      ip_address: ip
    }

    try {
      const res = await fetch(`${API_BASE}/admin-users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...auth.getAuthHeader()
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Failed to update admin")
        return
      }

      navigate("/admins")
    } catch (err) {
      setError("Failed to update admin")
    }
  }

  if (!form) return <h4 className="p-3">Loading...</h4>

  return (
    <CCard>
      <CCardHeader><h4>Edit Admin User</h4></CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Full Name"
                className="mb-3"
                value={form.full_name || ""}
                onChange={(e) => handleChange("full_name", e.target.value)}
                required
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Email"
                type="email"
                className="mb-3"
                value={form.email || ""}
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
                value={form.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </CCol>

            {/* 🔒 Property dropdown — disabled */}
            <CCol md={6}>
              <CFormSelect
                label="Assigned Property"
                className="mb-3"
                value={form.property_id || ""}
                disabled
              >
                <option value="">Select Property</option>
                {properties.map(p => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.property_name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          <CButton color="primary" type="submit">
            Update Admin
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default AdminEdit
