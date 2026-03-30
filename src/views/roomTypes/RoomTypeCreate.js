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
import RoomTypeImages from './RoomTypeImages'
import RoomTypePricing from './RoomTypePricing'
import IconOnlyButton from '../../components/IconOnlyButton'
import { findMasterRoomTypeById, getListData, readJsonSafely } from './roomTypeMasterUtils'

const RoomTypeCreate = () => {
  const auth = useAuth()
  const API_BASE = auth.API_BASE

  const [activeTab, setActiveTab] = useState(1)
  const [roomTypeId, setRoomTypeId] = useState(null)

  const [properties, setProperties] = useState([])
  const [masterRoomTypes, setMasterRoomTypes] = useState([])
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    master_room_type_id: '',
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
    const loadDropdowns = async () => {
      try {
        const [propertiesRes, mastersRes] = await Promise.all([
          fetch(`${API_BASE}/properties?_perPage=500`, {
            headers: auth.getAuthHeader(),
          }),
          fetch(`${API_BASE}/room-type-masters`, {
            headers: auth.getAuthHeader(),
          }),
        ])

        const [propertiesData, mastersData] = await Promise.all([
          propertiesRes.json(),
          readJsonSafely(mastersRes),
        ])

        setProperties(propertiesData.data || propertiesData)
        setMasterRoomTypes(getListData(mastersData))
      } catch (loadError) {
        setError('Failed to load properties or room type masters')
      }
    }

    loadDropdowns()
  }, [])

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  const handleMasterRoomTypeChange = (value) => {
    const selectedMaster = findMasterRoomTypeById(masterRoomTypes, value)

    setForm((currentForm) => ({
      ...currentForm,
      master_room_type_id: value,
      base_occupancy: selectedMaster?.base_occupancy ?? '',
      max_occupancy: selectedMaster?.max_occupancy ?? '',
    }))
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

      setRoomTypeId(data.room_type_id || data?.data?.room_type_id || null)

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
          <CTabPane visible={activeTab === 1}>
            {error && <CAlert color="danger">{error}</CAlert>}

            <CForm onSubmit={handleSubmit} className="mt-3">
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormSelect
                    label="Room Type Master"
                    required
                    value={form.master_room_type_id}
                    onChange={(e) => handleMasterRoomTypeChange(e.target.value)}
                  >
                    <option value="">Select Room Type Master</option>
                    {masterRoomTypes.map((master) => {
                      const masterId =
                        master.room_type_master_id || master.master_room_type_id || master.id

                      return (
                        <option key={masterId} value={masterId}>
                          {master.room_type_name}
                          {master.room_type_code ? ` (${master.room_type_code})` : ''}
                        </option>
                      )
                    })}
                  </CFormSelect>
                </CCol>

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
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    label="Room Type Code"
                    value={form.room_type_code}
                    onChange={(e) => handleChange('room_type_code', e.target.value)}
                  />
                </CCol>

                <CCol md={6}>
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

          <CTabPane visible={activeTab === 2}>
            {roomTypeId && <RoomTypeImages roomTypeId={roomTypeId} />}
          </CTabPane>

          <CTabPane visible={activeTab === 3}>
            {roomTypeId && <RoomTypePricing roomTypeId={roomTypeId} />}
          </CTabPane>
        </CTabContent>
      </CCardBody>
    </CCard>
  )
}

export default RoomTypeCreate
