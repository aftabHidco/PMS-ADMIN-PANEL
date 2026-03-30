import React, { useEffect, useState } from 'react'
import CIcon from '@coreui/icons-react'
import { cilSave } from '@coreui/icons'
import {
  CAlert,
  CButton,
  CCol,
  CForm,
  CFormInput,
  CFormSwitch,
  CFormTextarea,
  CRow,
} from '@coreui/react'
import {
  EMPTY_MASTER_ROOM_TYPE_FORM,
  buildMasterRoomTypePayload,
  toMasterRoomTypeFormValues,
} from './roomTypeMasterUtils'

const RoomTypeMasterForm = ({
  initialValues = EMPTY_MASTER_ROOM_TYPE_FORM,
  error = '',
  submitting = false,
  submitLabel = 'Save Master Room Type',
  onSubmit,
}) => {
  const [form, setForm] = useState(() => toMasterRoomTypeFormValues(initialValues))
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    setForm(toMasterRoomTypeFormValues(initialValues))
  }, [initialValues])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setValidationError('')

    const payload = buildMasterRoomTypePayload(form)

    if (!payload.room_type_name) {
      setValidationError('Room type name is required.')
      return
    }

    if (!Number.isInteger(payload.base_occupancy) || payload.base_occupancy < 1) {
      setValidationError('Base occupancy must be at least 1.')
      return
    }

    if (!Number.isInteger(payload.max_occupancy) || payload.max_occupancy < payload.base_occupancy) {
      setValidationError('Max occupancy must be greater than or equal to base occupancy.')
      return
    }

    await onSubmit(payload)
  }

  const combinedError = validationError || error

  return (
    <>
      {combinedError && <CAlert color="danger">{combinedError}</CAlert>}

      <CForm onSubmit={handleSubmit}>
        <CRow className="mb-3">
          <CCol md={6}>
            <CFormInput
              label="Master Room Type Code"
              value={form.room_type_code}
              onChange={(event) => handleChange('room_type_code', event.target.value)}
              disabled={submitting}
            />
          </CCol>

          <CCol md={6}>
            <CFormInput
              label="Master Room Type Name"
              value={form.room_type_name}
              onChange={(event) => handleChange('room_type_name', event.target.value)}
              required
              disabled={submitting}
            />
          </CCol>
        </CRow>

        <CRow className="mb-3">
          <CCol md={6}>
            <CFormInput
              type="number"
              min={1}
              label="Base Occupancy"
              value={form.base_occupancy}
              onChange={(event) => handleChange('base_occupancy', event.target.value)}
              required
              disabled={submitting}
            />
          </CCol>

          <CCol md={6}>
            <CFormInput
              type="number"
              min={1}
              label="Max Occupancy"
              value={form.max_occupancy}
              onChange={(event) => handleChange('max_occupancy', event.target.value)}
              required
              disabled={submitting}
            />
          </CCol>
        </CRow>

        <CRow className="mb-3">
          <CCol md={12}>
            <CFormTextarea
              label="Description"
              rows={4}
              value={form.description}
              onChange={(event) => handleChange('description', event.target.value)}
              disabled={submitting}
            />
          </CCol>
        </CRow>

        <CRow className="mb-4 align-items-end">
          <CCol md={6}>
            <CFormSwitch
              label="Active"
              checked={!!form.is_active}
              onChange={(event) => handleChange('is_active', event.target.checked)}
              disabled={submitting}
            />
          </CCol>
        </CRow>

        <div className="d-flex justify-content-end">
          <CButton color="primary" type="submit" disabled={submitting}>
            <span className="d-inline-flex align-items-center gap-2">
              <CIcon icon={cilSave} />
              {submitting ? 'Saving...' : submitLabel}
            </span>
          </CButton>
        </div>
      </CForm>
    </>
  )
}

export default RoomTypeMasterForm
