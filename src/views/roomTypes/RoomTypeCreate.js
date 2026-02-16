import React, { useEffect, useState } from 'react'
import { cilSave } from '@coreui/icons'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormSelect,
  CAlert,
  CRow,
  CCol,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
} from '@coreui/react'

import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import RoomTypeImages from './RoomTypeImages'
import RoomTypePricing from './RoomTypePricing'
import IconOnlyButton from '../../components/IconOnlyButton'

const RoomTypeCreate = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  // TAB STATE
  const [activeTab, setActiveTab] = useState(1)

  // After save → room_type_id is set → Tab2 & 3 unlock
  const [roomTypeId, setRoomTypeId] = useState(null)

  const [properties, setProperties] = useState([])
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    property_id: '',
    room_type_code: '',
    room_type_name: '',
    base_occupancy: '',
    max_occupancy: '',
    qty: '',
    inventory_mode: 'static',
    description: '',
  })

  useEffect(() => {
    fetch(`${API_BASE}/properties?_perPage=500`, {
      headers: auth.getAuthHeader(),
    })
      .then((res) => res.json())
      .then((data) => setProperties(data.data || data))
      .catch(() => setError('Failed to load properties'))
  }, [])

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`${API_BASE}/room-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save Room Type')
        return
      }

      // Unlock next tabs
      setRoomTypeId(data.room_type_id)

      alert('Room Type saved successfully')
    } catch (err) {
      setError('Failed to save room type')
    }
  }

  const blockIfNotSaved = () => {
    if (!roomTypeId) {
      alert('Please save Room Type details first.')
      return true
    }
    return false
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>Create Room Type</h4>
      </CCardHeader>

      <CCardBody>
        {/* TOP NAV TABS */}
        <CNav variant="tabs">
          <CNavItem>
            <CNavLink active={activeTab === 1} onClick={() => setActiveTab(1)}>
              Room Type Details
            </CNavLink>
          </CNavItem>

          <CNavItem>
            <CNavLink
              active={activeTab === 2}
              onClick={() => {
                if (blockIfNotSaved()) return
                setActiveTab(2)
              }}
            >
              Images
            </CNavLink>
          </CNavItem>

          <CNavItem>
            <CNavLink
              active={activeTab === 3}
              onClick={() => {
                if (blockIfNotSaved()) return
                setActiveTab(3)
              }}
            >
              Pricing
            </CNavLink>
          </CNavItem>
        </CNav>

        <CTabContent>
          {/* TAB 1 — DETAILS */}
          <CTabPane visible={activeTab === 1}>
            {error && <CAlert color="danger">{error}</CAlert>}

            <CForm onSubmit={handleSubmit} className="mt-3">
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormSelect
                    label="Property"
                    required
                    value={form.property_id}
                    onChange={(e) => handleChange('property_id', e.target.value)}
                  >
                    <option value="">Select Property</option>
                    {properties.map((p) => (
                      <option key={p.property_id} value={p.property_id}>
                        {p.property_name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={6}>
                  <CFormInput
                    label="Room Type Code"
                    value={form.room_type_code}
                    onChange={(e) => handleChange('room_type_code', e.target.value)}
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={12}>
                  <CFormInput
                    label="Room Type Name"
                    value={form.room_type_name}
                    onChange={(e) => handleChange('room_type_name', e.target.value)}
                    required
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    type="number"
                    label="Base Occupancy"
                    value={form.base_occupancy}
                    onChange={(e) => handleChange('base_occupancy', e.target.value)}
                    required
                  />
                </CCol>

                <CCol md={6}>
                  <CFormInput
                    type="number"
                    label="Max Occupancy"
                    value={form.max_occupancy}
                    onChange={(e) => handleChange('max_occupancy', e.target.value)}
                    required
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    type="number"
                    label="Quantity"
                    value={form.qty}
                    onChange={(e) => handleChange('qty', e.target.value)}
                  />
                </CCol>

                <CCol md={6}>
                  <CFormInput label="Inventory Mode" value="static" disabled />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={12}>
                  <CFormTextarea
                    label="Description"
                    rows={4}
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </CCol>
              </CRow>

              <div className="d-flex justify-content-end mt-2">
                <IconOnlyButton icon={cilSave} tone="primary" label="Save Room Type" type="submit" />
              </div>
            </CForm>
          </CTabPane>

          {/* TAB 2 — IMAGES */}
          <CTabPane visible={activeTab === 2}>
            {roomTypeId && <RoomTypeImages roomTypeId={roomTypeId} />}
          </CTabPane>

          {/* TAB 3 — PRICING */}
          <CTabPane visible={activeTab === 3}>
            {roomTypeId && <RoomTypePricing roomTypeId={roomTypeId} />}
          </CTabPane>
        </CTabContent>
      </CCardBody>
    </CCard>
  )
}

export default RoomTypeCreate
