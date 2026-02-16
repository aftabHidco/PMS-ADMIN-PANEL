// src/views/cancellation/CancellationPolicyEdit.js
import React, { useEffect, useState } from 'react'
import { cilSave } from '@coreui/icons'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormTextarea,
  CAlert,
} from '@coreui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const CancellationPolicyEdit = () => {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    rules: '',
  })

  useEffect(() => {
    fetch(`${API_BASE}/cancellation-policies/${id}`, {
      headers: auth.getAuthHeader(),
    })
      .then((res) => res.json())
      .then((data) => {
        setForm({
          name: data.name,
          description: data.description,
          rules: data.rules,
        })
      })
      .catch(() => setError('Failed to load policy'))
  }, [])

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      ...form,
      updated_by: auth.user?.id,
      ip_address: 'auto',
    }

    try {
      const res = await fetch(`${API_BASE}/cancellation-policies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update')
        return
      }

      alert('Updated successfully')
    } catch (err) {
      setError('Failed to update')
    }
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>Edit Cancellation Policy</h4>
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

          <CFormTextarea
            label="Policy Rules"
            rows={5}
            className="mb-3"
            value={form.rules}
            onChange={(e) => handleChange('rules', e.target.value)}
          />

          <div className="d-flex justify-content-end mt-2">
            <IconOnlyButton icon={cilSave} tone="primary" label="Update Policy" type="submit" />
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default CancellationPolicyEdit
