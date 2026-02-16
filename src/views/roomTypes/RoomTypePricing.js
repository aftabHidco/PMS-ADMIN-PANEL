// src/views/roomTypes/RoomTypePricing.js
import React, { useEffect, useState } from 'react'
import { cilPlus, cilTrash } from '@coreui/icons'
import {
  CCard,
  CCardBody,
  CForm,
  CFormSelect,
  CFormInput,
  CTable,
  CTableRow,
  CTableHead,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CRow,
  CCol,
} from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const RoomTypePricing = ({ roomTypeId }) => {
  const auth = useAuth()
  const API_BASE = auth.API_BASE

  const [pricing, setPricing] = useState([])
  const [seasons, setSeasons] = useState([])

  const [form, setForm] = useState({
    season_id: '',
    day_type: 'weekday',
    price: '',
  })

  const loadPricing = () => {
    fetch(`${API_BASE}/room-pricing?room_type_id=${roomTypeId}`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => setPricing(d.data || d))
  }

  const loadSeasons = () => {
    fetch(`${API_BASE}/seasons?_perPage=500`, {
      headers: auth.getAuthHeader(),
    })
      .then((r) => r.json())
      .then((d) => setSeasons(d.data || d))
  }

  const seasonMap = Object.fromEntries(seasons.map((s) => [s.season_id, s.season_name]))

  useEffect(() => {
    loadPricing()
    loadSeasons()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    await fetch(`${API_BASE}/room-pricing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify({
        ...form,
        room_type_id: roomTypeId,
      }),
    })

    setForm({ season_id: '', day_type: 'weekday', price: '' })
    loadPricing()
  }

  const deletePricing = async (id) => {
    if (!window.confirm('Delete pricing rule?')) return

    await fetch(`${API_BASE}/room-pricing/${id}`, {
      method: 'DELETE',
      headers: auth.getAuthHeader(),
    })

    loadPricing()
  }

  return (
    <CCard className="mt-3">
      <CCardBody>
        <h5>Create Pricing Rule</h5>

        <CForm onSubmit={handleSubmit} className="mb-4">
          <CRow className="mb-2">
            <CCol md={4}>
              <CFormSelect
                label="Season"
                value={form.season_id}
                onChange={(e) => setForm({ ...form, season_id: e.target.value })}
              >
                <option value="">Select Season</option>
                {seasons.map((s) => (
                  <option key={s.season_id} value={s.season_id}>
                    {s.season_name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={4}>
              <CFormSelect
                label="Day Type"
                value={form.day_type}
                onChange={(e) => setForm({ ...form, day_type: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="weekday">Weekday</option>
                <option value="weekend">Weekend</option>
                <option value="special">Special</option>
              </CFormSelect>
            </CCol>

            <CCol md={4}>
              <CFormInput
                type="number"
                label="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </CCol>
          </CRow>

          <IconOnlyButton icon={cilPlus} tone="primary" label="Add Pricing" type="submit" />
        </CForm>

        <hr />

        <h5>Pricing Rules</h5>
        <CTable striped>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Season</CTableHeaderCell>
              <CTableHeaderCell>Day Type</CTableHeaderCell>
              <CTableHeaderCell>Price</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {pricing.map((p) => (
              <CTableRow key={p.pricing_id}>
                <CTableDataCell>{seasonMap[p.season_id] || 'No Season'}</CTableDataCell>

                <CTableDataCell>{p.day_type}</CTableDataCell>
                <CTableDataCell>{p.price}</CTableDataCell>

                <CTableDataCell>
                  <IconOnlyButton
                    icon={cilTrash}
                    tone="danger"
                    size="sm"
                    label="Delete Pricing"
                    onClick={() => deletePricing(p.pricing_id)}
                  />
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  )
}

export default RoomTypePricing
