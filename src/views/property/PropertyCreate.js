// src/views/properties/PropertyCreate.js
import React, { useState } from 'react'
import { cilSave } from '@coreui/icons'
import { CCard, CCardHeader, CCardBody, CForm, CFormInput, CAlert, CRow, CCol } from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import IconOnlyButton from '../../components/IconOnlyButton'

const PropertyCreate = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [form, setForm] = useState({
    property_name: '',
    property_code: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  })

  const [error, setError] = useState('')

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`${API_BASE}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to create property')
        return
      }

      navigate('/properties')
    } catch (err) {
      setError('Failed to create property')
    }
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>Create Property</h4>
      </CCardHeader>

      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormInput
                label="Property Name"
                value={form.property_name}
                onChange={(e) => handleChange('property_name', e.target.value)}
                required
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Property Code"
                value={form.property_code}
                onChange={(e) => handleChange('property_code', e.target.value)}
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={12}>
              <CFormInput
                label="Address"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                required
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={4}>
              <CFormInput
                label="City"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                required
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                label="State"
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
                required
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                label="Country"
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
                required
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={4}>
              <CFormInput
                label="Pincode"
                value={form.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
              />
            </CCol>
          </CRow>

          <div className="d-flex justify-content-end mt-2">
            <IconOnlyButton icon={cilSave} tone="primary" label="Save Property" type="submit" />
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default PropertyCreate
