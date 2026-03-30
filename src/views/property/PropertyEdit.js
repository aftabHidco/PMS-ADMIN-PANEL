// src/views/properties/PropertyEdit.js
import React, { useEffect, useState } from 'react'
import { cilSave } from '@coreui/icons'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormInput,
  CAlert,
  CRow,
  CCol,
  CFormSwitch,
  CFormTextarea,
} from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate, useParams } from 'react-router-dom'
import IconOnlyButton from '../../components/IconOnlyButton'
import {
  isValidPropertyImageFile,
  readFileAsDataUrl,
  resolvePropertyImageUrl,
  toBooleanFlag,
} from './propertyFormUtils'

const PropertyEdit = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const API_BASE = auth.API_BASE

  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/properties/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const p = data?.data || data
        setForm({
          ...p,
          geo_location: p?.geo_location || '',
          property_image: p?.property_image || '',
          property_image_file: null,
          is_featured: toBooleanFlag(p?.is_featured),
          auto_accept_enabled: toBooleanFlag(p?.auto_accept_enabled),
          auto_accept_interval_minutes: Number(p?.auto_accept_interval_minutes || 10),
        })
      })
      .catch(() => setError('Failed to load property'))
  }, [])

  useEffect(() => {
    if (!(form?.property_image_file instanceof File)) {
      setImagePreviewUrl(resolvePropertyImageUrl(form?.property_image, API_BASE))
      return undefined
    }

    const objectUrl = URL.createObjectURL(form.property_image_file)
    setImagePreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [API_BASE, form?.property_image, form?.property_image_file])

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  const handleImageChange = (file) => {
    if (!file) {
      setError('')
      setForm({ ...form, property_image_file: null })
      return
    }

    if (!isValidPropertyImageFile(file)) {
      setError('Only image files are allowed for property image.')
      return
    }

    setError('')
    setForm({ ...form, property_image_file: file })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    let propertyImage = String(form.property_image || '').trim()

    if (form.property_image_file instanceof File) {
      try {
        propertyImage = await readFileAsDataUrl(form.property_image_file)
      } catch (imageError) {
        setError(imageError.message || 'Failed to process property image')
        return
      }
    }

    const payload = {
      ...form,
      property_image: propertyImage || null,
      geo_location: String(form.geo_location || '').trim() || null,
      is_featured: !!form.is_featured,
      auto_accept_enabled: !!form.auto_accept_enabled,
      auto_accept_interval_minutes: Number(form.auto_accept_interval_minutes || 0),
    }
    delete payload.property_image_file
    delete payload.country

    try {
      const res = await fetch(`${API_BASE}/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to update property')
        return
      }

      navigate('/properties')
    } catch (err) {
      setError('Failed to update property')
    }
  }

  if (!form) return <h4 className="p-3">Loading...</h4>

  return (
    <CCard>
      <CCardHeader>
        <h4>Edit Property</h4>
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
                label="Pincode"
                value={form.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={12}>
              <CFormTextarea
                label="Geo Location (Embedded Map iframe)"
                rows={4}
                value={form.geo_location}
                onChange={(e) => handleChange('geo_location', e.target.value)}
                placeholder='<iframe src="https://www.google.com/maps/embed?pb=..."></iframe>'
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={8}>
              <CFormInput
                type="file"
                accept="image/*"
                label="Property Image"
                onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
              />
              <div className="form-text">
                {form.property_image_file instanceof File
                  ? `Selected file: ${form.property_image_file.name}`
                  : imagePreviewUrl
                    ? 'Leave empty to keep the current property image.'
                    : 'Upload a property image file.'}
              </div>
            </CCol>
            <CCol md={4}>
              <label className="form-label d-block">Image Preview</label>
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt={form.property_name || 'Property preview'}
                  style={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 12,
                    border: '1px solid #d8dbe0',
                    backgroundColor: '#f8fafc',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 12,
                    border: '1px solid #d8dbe0',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    textAlign: 'center',
                    padding: '1rem',
                  }}
                >
                  Select a property image to preview it here
                </div>
              )}
            </CCol>
          </CRow>

          <CRow className="mb-3 align-items-end">
            <CCol md={4}>
              <CFormSwitch
                label="Auto Accept Bookings"
                checked={!!form.auto_accept_enabled}
                onChange={(e) => handleChange('auto_accept_enabled', e.target.checked)}
              />
            </CCol>
            <CCol md={4}>
              <CFormSwitch
                label="Featured Property"
                checked={!!form.is_featured}
                onChange={(e) => handleChange('is_featured', e.target.checked)}
              />
            </CCol>
            <CCol md={4}>
              <CFormInput
                type="number"
                min={1}
                label="Auto Accept Interval (minutes)"
                value={form.auto_accept_interval_minutes}
                disabled={!form.auto_accept_enabled}
                onChange={(e) => handleChange('auto_accept_interval_minutes', e.target.value)}
                required={!!form.auto_accept_enabled}
              />
            </CCol>
          </CRow>

          <div className="d-flex justify-content-end mt-2">
            <IconOnlyButton icon={cilSave} tone="primary" label="Update Property" type="submit" />
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default PropertyEdit
