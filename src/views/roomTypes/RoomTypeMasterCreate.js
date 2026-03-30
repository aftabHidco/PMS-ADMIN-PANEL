import React, { useState } from 'react'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import RoomTypeMasterForm from './RoomTypeMasterForm'
import { getErrorMessage, readJsonSafely } from './roomTypeMasterUtils'

const RoomTypeMasterCreate = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (payload) => {
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`${API_BASE}/room-type-masters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const data = await readJsonSafely(res)

      if (!res.ok) {
        setError(getErrorMessage(data, 'Failed to save room type master'))
        return
      }

      navigate('/room-type-masters', {
        state: {
          success: 'Room type master created successfully.',
        },
      })
    } catch (saveError) {
      setError(saveError.message || 'Failed to save room type master')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>Create Room Type Master</h4>
      </CCardHeader>

      <CCardBody>
        <RoomTypeMasterForm
          error={error}
          submitting={saving}
          submitLabel="Save Room Type Master"
          onSubmit={handleSubmit}
        />
      </CCardBody>
    </CCard>
  )
}

export default RoomTypeMasterCreate
