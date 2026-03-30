// src/views/cancellation/CancellationPolicyCreate.js
import React, { useState } from 'react'
import { cilPlus } from '@coreui/icons'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormTextarea,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const CancellationPolicyCreate = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    deduction_percentage: '',
    refund_window_days: '',
    applies_on_booking_status: 'cancelled',
  })

  const parseStatusList = (value) =>
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const actorId = auth.user?.user_id || auth.user?.id
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      deduction_percentage: Number(form.deduction_percentage || 0),
      rules: {
        refund_window_days: Number(form.refund_window_days || 0),
        applies_on_booking_status: parseStatusList(form.applies_on_booking_status),
      },
      ...(actorId ? { created_by: actorId, updated_by: actorId } : {}),
      ip_address: 'auto',
    }

    try {
      const res = await fetch(`${API_BASE}/cancellation-policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.message || data?.error || 'Failed to create')
        return
      }

      navigate('/cancellation')
    } catch (err) {
      setError('Failed to create')
    }
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>Create Cancellation Policy</h4>
      </CCardHeader>
      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          <CFormInput
            label="Policy Name"
            className="mb-3"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />

          <CFormTextarea
            label="Description"
            rows={3}
            className="mb-3"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />

          <CFormInput
            type="number"
            min={0}
            max={100}
            step="0.01"
            label="Deduction Percentage"
            className="mb-3"
            value={form.deduction_percentage}
            onChange={(e) => handleChange('deduction_percentage', e.target.value)}
            required
          />

          <CFormInput
            type="number"
            min={0}
            label="Refund Window (Days)"
            className="mb-3"
            value={form.refund_window_days}
            onChange={(e) => handleChange('refund_window_days', e.target.value)}
            required
          />

          <CFormInput
            label="Applies On Booking Status"
            className="mb-3"
            value={form.applies_on_booking_status}
            onChange={(e) => handleChange('applies_on_booking_status', e.target.value)}
            placeholder="cancelled,expired"
            required
          />

          <div className="d-flex justify-content-end mt-2">
            <IconOnlyButton icon={cilPlus} tone="primary" label="Create Policy" type="submit" />
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default CancellationPolicyCreate
