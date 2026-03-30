import React, { useState } from 'react'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import SuperAdminOnly from '../../components/SuperAdminOnly'
import WebsiteSliderForm from './WebsiteSliderForm'
import {
  buildWebsiteSliderBulkFormData,
  createDefaultWebsiteSliderForm,
  getWebsiteSliderImageValidationMessage,
  hasWebsiteSliderApiError,
  getApiErrorMessage,
  parseJsonSafely,
  validateWebsiteSliderDisplayOrder,
} from './websiteSliderUtils'

const WebsiteSliderCreate = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const API_BASE = auth.API_BASE

  const [form, setForm] = useState(createDefaultWebsiteSliderForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (key, value) => {
    if (key === 'display_order') {
      setError('')
    }
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleImagesChange = (files) => {
    const nextFiles = Array.isArray(files) ? files : []
    const validationMessage = getWebsiteSliderImageValidationMessage(nextFiles, { multiple: true })

    if (validationMessage) {
      setError(validationMessage)
      setForm((current) => ({ ...current, images: [] }))
      return
    }

    setError('')
    setForm((current) => ({ ...current, images: nextFiles }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const displayOrderError = validateWebsiteSliderDisplayOrder(form.display_order)
    if (displayOrderError) {
      setError(displayOrderError)
      return
    }

    const selectedImages = Array.isArray(form.images) ? form.images : []
    if (!selectedImages.length) {
      setError('Select at least one image before saving.')
      return
    }

    const imageValidationMessage = getWebsiteSliderImageValidationMessage(selectedImages, {
      multiple: true,
    })
    if (imageValidationMessage) {
      setError(imageValidationMessage)
      return
    }

    setSubmitting(true)

    try {
      const payload = buildWebsiteSliderBulkFormData(form)
      const response = await fetch(`${API_BASE}/website-sliders`, {
        method: 'POST',
        headers: {
          ...auth.getAuthHeader(),
        },
        body: payload,
      })
      const body = await parseJsonSafely(response)

      if (response.status === 403) {
        throw new Error('You do not have permission to create Website Sliders.')
      }

      if (!response.ok || hasWebsiteSliderApiError(body)) {
        throw new Error(getApiErrorMessage(body, 'Failed to create website slider'))
      }

      navigate('/website-sliders', {
        state: {
          toast: {
            color: 'success',
            title: 'Website Sliders',
            message: body?.message || 'Website sliders created successfully.',
          },
        },
      })
    } catch (err) {
      setError(err.message || 'Failed to create website slider')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SuperAdminOnly message="Website Sliders are available to super admins only.">
      <CCard>
        <CCardHeader>
          <h4 className="mb-0">Create Website Slider</h4>
        </CCardHeader>

        <CCardBody>
          <WebsiteSliderForm
            mode="create"
            apiBase={API_BASE}
            error={error}
            form={form}
            onChange={handleChange}
            onImagesChange={handleImagesChange}
            onSubmit={handleSubmit}
            submitLabel="Save Website Sliders"
            submitting={submitting}
          />
        </CCardBody>
      </CCard>
    </SuperAdminOnly>
  )
}

export default WebsiteSliderCreate
