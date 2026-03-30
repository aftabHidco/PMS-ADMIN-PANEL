// src/views/roomTypes/RoomTypeEdit.js
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
import { useParams } from 'react-router-dom'

import RoomTypeImages from './RoomTypeImages'
import RoomTypePricing from './RoomTypePricing'
import IconOnlyButton from '../../components/IconOnlyButton'
import { findMasterRoomTypeById, getListData, readJsonSafely } from './roomTypeMasterUtils'

const RoomTypeEdit = () => {
  const { id } = useParams()
  const auth = useAuth()
  const API_BASE = auth.API_BASE

  const [activeTab, setActiveTab] = useState(1)
  const [roomTypeId] = useState(id)

  const [properties, setProperties] = useState([])
  const [masterRoomTypes, setMasterRoomTypes] = useState([])
  const [propertyName, setPropertyName] = useState('')
  const [roomTypeName, setRoomTypeName] = useState('')

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
    fetch(`${API_BASE}/properties?_perPage=200`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => {
        const props = d.data || d
        setProperties(props)
      })
      .catch(() => setError('Failed to load properties'))
  }, [])

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const res = await fetch(`${API_BASE}/room-type-masters`, {
          headers: auth.getAuthHeader(),
        })

        const data = await readJsonSafely(res)
        setMasterRoomTypes(getListData(data))
      } catch (loadError) {
        setError('Failed to load room type masters')
      }
    }

    loadMasters()
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/room-types/${id}`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => {
        const roomType = d?.data || d

        setForm({
          master_room_type_id: roomType.master_room_type_id || '',
          property_id: roomType.property_id,
          room_type_code: roomType.room_type_code,
          room_type_name: roomType.room_type_name,
          base_occupancy: roomType.base_occupancy,
          max_occupancy: roomType.max_occupancy,
          qty: roomType.qty,
          inventory_mode: roomType.inventory_mode || 'static',
          description: roomType.description,
        })

        setRoomTypeName(roomType.room_type_name)
      })
      .catch(() => setError('Failed to load room type'))
  }, [])

  useEffect(() => {
    const found = properties.find((p) => p.property_id == form.property_id)
    if (found) setPropertyName(found.property_name)
  }, [form.property_id, properties])

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
      const res = await fetch(`${API_BASE}/room-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update')
        return
      }

      alert('Room Type updated successfully')

      const p = properties.find((x) => x.property_id == form.property_id)
      if (p) setPropertyName(p.property_name)
      setRoomTypeName(form.room_type_name)
    } catch (err) {
      setError('Failed to update room type')
    }
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>
          Edit Room Type
          {propertyName && roomTypeName ? ` — ${propertyName} / ${roomTypeName}` : ''}
        </h4>
      </CCardHeader>

      <CCardBody>
        <CNav variant="tabs">
          <CNavItem>
            <CNavLink active={activeTab === 1} onClick={() => setActiveTab(1)}>
              Details
            </CNavLink>
          </CNavItem>

          <CNavItem>
            <CNavLink active={activeTab === 2} onClick={() => setActiveTab(2)}>
              Images
            </CNavLink>
          </CNavItem>

          <CNavItem>
            <CNavLink active={activeTab === 3} onClick={() => setActiveTab(3)}>
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
                    value={form.master_room_type_id}
                    onChange={(e) => handleMasterRoomTypeChange(e.target.value)}
                    required
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
                    value={form.property_id}
                    onChange={(e) => handleChange('property_id', e.target.value)}
                  >
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
                    required
                    value={form.room_type_name}
                    onChange={(e) => handleChange('room_type_name', e.target.value)}
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
                  />
                </CCol>

                <CCol md={6}>
                  <CFormInput
                    type="number"
                    label="Max Occupancy"
                    value={form.max_occupancy}
                    onChange={(e) => handleChange('max_occupancy', e.target.value)}
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
                <IconOnlyButton
                  icon={cilSave}
                  tone="primary"
                  label="Update Room Type"
                  type="submit"
                />
              </div>
            </CForm>
          </CTabPane>

          <CTabPane visible={activeTab === 2}>
            <RoomTypeImages roomTypeId={roomTypeId} />
          </CTabPane>

          <CTabPane visible={activeTab === 3}>
            <RoomTypePricing roomTypeId={roomTypeId} />
          </CTabPane>
        </CTabContent>
      </CCardBody>
    </CCard>
  )
}

export default RoomTypeEdit
