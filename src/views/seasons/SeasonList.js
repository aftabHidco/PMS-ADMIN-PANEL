// src/views/seasons/SeasonList.js
import React, { useEffect, useState } from 'react'
import { cilPencil, cilPlus, cilTrash } from '@coreui/icons'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

// ✅ Month value → label map
const MONTH_MAP = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  10: 'October',
  11: 'November',
  12: 'December',
}

const SeasonList = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [seasons, setSeasons] = useState([])
  const [properties, setProperties] = useState([])

  // -------------------------
  // LOAD PROPERTIES
  // -------------------------
  const loadProperties = async () => {
    const res = await fetch(`${API_BASE}/properties?_perPage=500`, {
      headers: auth.getAuthHeader(),
    })
    const data = await res.json()
    setProperties(data.data || [])
  }

  // -------------------------
  // LOAD SEASONS
  // -------------------------
  const loadSeasons = async () => {
    const res = await fetch(`${API_BASE}/seasons?_perPage=500`, {
      headers: auth.getAuthHeader(),
    })
    const data = await res.json()
    setSeasons(data.data || [])
  }

  useEffect(() => {
    loadProperties()
    loadSeasons()
  }, [])

  // -------------------------
  // Helpers
  // -------------------------
  const getPropertyName = (id) => {
    const match = properties.find((p) => p.property_id === id)
    return match ? match.property_name : `ID: ${id}`
  }

  const getMonthName = (val) => MONTH_MAP[val] || val

  const deleteSeason = async (id) => {
    if (!window.confirm('Are you sure you want to delete this season?')) return

    await fetch(`${API_BASE}/seasons/${id}`, {
      method: 'DELETE',
      headers: auth.getAuthHeader(),
    })

    loadSeasons()
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>Seasons</h4>
        <IconOnlyButton
          icon={cilPlus}
          tone="primary"
          label="Create Season"
          onClick={() => navigate('/seasons/create')}
        />
      </CCardHeader>

      <CCardBody>
        <CTable hover>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>ID</CTableHeaderCell>
              <CTableHeaderCell>Property</CTableHeaderCell>
              <CTableHeaderCell>Season Name</CTableHeaderCell>
              <CTableHeaderCell>Start Month</CTableHeaderCell>
              <CTableHeaderCell>End Month</CTableHeaderCell>
              <CTableHeaderCell>Type</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {seasons.map((s) => (
              <CTableRow key={s.season_id}>
                <CTableDataCell>{s.season_id}</CTableDataCell>
                <CTableDataCell>{getPropertyName(s.property_id)}</CTableDataCell>
                <CTableDataCell>{s.season_name}</CTableDataCell>

                {/* ✅ Month name instead of number */}
                <CTableDataCell>{getMonthName(s.start_date)}</CTableDataCell>
                <CTableDataCell>{getMonthName(s.end_date)}</CTableDataCell>

                <CTableDataCell>{s.is_peak ? 'Peak' : 'Normal'}</CTableDataCell>

                <CTableDataCell>
                  <IconOnlyButton
                    icon={cilPencil}
                    tone="info"
                    size="sm"
                    className="me-2"
                    label="Edit Season"
                    onClick={() => navigate(`/seasons/${s.season_id}/edit`)}
                  />

                  <IconOnlyButton
                    icon={cilTrash}
                    tone="danger"
                    size="sm"
                    label="Delete Season"
                    onClick={() => deleteSeason(s.season_id)}
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

export default SeasonList
