import React, { useEffect, useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate, useParams } from 'react-router-dom'
import RoomTypeMasterForm from './RoomTypeMasterForm'
import {
  getErrorMessage,
  getListData,
  getMasterRoomTypeId,
  readJsonSafely,
  toMasterRoomTypeFormValues,
} from './roomTypeMasterUtils'

const RoomTypeMasterEdit = () => {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [masterRoomTypeName, setMasterRoomTypeName] = useState('')
  const [initialValues, setInitialValues] = useState(null)

  useEffect(() => {
    const loadMasterRoomType = async () => {
      try {
        const res = await fetch(`${API_BASE}/room-type-masters`, {
          headers: auth.getAuthHeader(),
        })

        const data = await readJsonSafely(res)

        if (!res.ok) {
          throw new Error(getErrorMessage(data, 'Failed to load room type masters'))
        }

        const matchedMasterRoomType = getListData(data).find(
          (item) => getMasterRoomTypeId(item) === Number(id),
        )

        if (!matchedMasterRoomType) {
          throw new Error('Room type master not found')
        }

        setInitialValues(toMasterRoomTypeFormValues(matchedMasterRoomType))
        setMasterRoomTypeName(matchedMasterRoomType.room_type_name || '')
      } catch (loadError) {
        setError(loadError.message || 'Failed to load room type master')
      } finally {
        setLoading(false)
      }
    }

    loadMasterRoomType()
  }, [API_BASE, auth, id])

  const handleSubmit = async (payload) => {
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`${API_BASE}/room-type-masters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const data = await readJsonSafely(res)

      if (!res.ok) {
        setError(getErrorMessage(data, 'Failed to update room type master'))
        return
      }

      navigate('/room-type-masters', {
        state: {
          success: 'Room type master updated successfully.',
        },
      })
    } catch (saveError) {
      setError(saveError.message || 'Failed to update room type master')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <CSpinner className="m-4" />

  return (
    <CCard>
      <CCardHeader>
        <h4>Edit Room Type Master{masterRoomTypeName ? ` — ${masterRoomTypeName}` : ''}</h4>
      </CCardHeader>

      <CCardBody>
        {!initialValues && error ? (
          <CAlert color="danger">{error}</CAlert>
        ) : (
          <RoomTypeMasterForm
            initialValues={initialValues || undefined}
            error={error}
            submitting={saving}
            submitLabel="Update Room Type Master"
            onSubmit={handleSubmit}
          />
        )}
      </CCardBody>
    </CCard>
  )
}

export default RoomTypeMasterEdit
