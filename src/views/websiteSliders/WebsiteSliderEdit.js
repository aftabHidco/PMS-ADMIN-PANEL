import React, { useEffect, useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader, CSpinner } from '@coreui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import SuperAdminOnly from '../../components/SuperAdminOnly'
import WebsiteSliderForm from './WebsiteSliderForm'
import {
  buildWebsiteSliderUpdateFormData,
  getWebsiteSliderImageValidationMessage,
  hasWebsiteSliderApiError,
  getApiErrorMessage,
  mapWebsiteSliderToForm,
  parseJsonSafely,
  unwrapWebsiteSliderResponse,
  validateWebsiteSliderDisplayOrder,
} from './websiteSliderUtils'

const WebsiteSliderEdit = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const API_BASE = auth.API_BASE

  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false

    const loadSlider = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_BASE}/website-sliders/${id}`, {
          headers: { ...auth.getAuthHeader() },
        })
        const body = await parseJsonSafely(response)

        if (response.status === 403) {
          throw new Error('You do not have permission to edit Website Sliders.')
        }

        if (!response.ok || hasWebsiteSliderApiError(body)) {
          throw new Error(getApiErrorMessage(body, 'Failed to load website slider'))
        }

        const slider = unwrapWebsiteSliderResponse(body)
        if (!ignore) {
          setForm(mapWebsiteSliderToForm(slider))
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load website slider')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadSlider()

    return () => {
      ignore = true
    }
  }, [API_BASE, auth, id])

  const handleChange = (key, value) => {
    if (key === 'display_order') {
      setError('')
    }
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleImageChange = (file) => {
    if (!file) {
      setError('')
      setForm((current) => ({ ...current, image: null }))
      return
    }

    const validationMessage = getWebsiteSliderImageValidationMessage([file])
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setError('')
    setForm((current) => ({ ...current, image: file }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const displayOrderError = validateWebsiteSliderDisplayOrder(form.display_order)
    if (displayOrderError) {
      setError(displayOrderError)
      return
    }

    if (form?.image instanceof File) {
      const imageValidationMessage = getWebsiteSliderImageValidationMessage([form.image])
      if (imageValidationMessage) {
        setError(imageValidationMessage)
        return
      }
    }

    setSubmitting(true)

    try {
      const payload = buildWebsiteSliderUpdateFormData(form)
      const response = await fetch(`${API_BASE}/website-sliders/${id}`, {
        method: 'PUT',
        headers: {
          ...auth.getAuthHeader(),
        },
        body: payload,
      })
      const body = await parseJsonSafely(response)

      if (response.status === 403) {
        throw new Error('You do not have permission to update Website Sliders.')
      }

      if (!response.ok || hasWebsiteSliderApiError(body)) {
        throw new Error(getApiErrorMessage(body, 'Failed to update website slider'))
      }

      navigate('/website-sliders', {
        state: {
          toast: {
            color: 'success',
            title: 'Website Sliders',
            message: body?.message || 'Website slider updated successfully.',
          },
        },
      })
    } catch (err) {
      setError(err.message || 'Failed to update website slider')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SuperAdminOnly message="Website Sliders are available to super admins only.">
      <CCard>
        <CCardHeader>
          <h4 className="mb-0">Edit Website Slider</h4>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="text-center my-4">
              <CSpinner color="primary" />
            </div>
          ) : !form ? (
            <CAlert color="danger">{error || 'Website slider not found'}</CAlert>
          ) : (
            <WebsiteSliderForm
              mode="edit"
              apiBase={API_BASE}
              error={error}
              form={form}
              onChange={handleChange}
              onImageChange={handleImageChange}
              onSubmit={handleSubmit}
              submitLabel="Update Website Slider"
              submitting={submitting}
            />
          )}
        </CCardBody>
      </CCard>
    </SuperAdminOnly>
  )
}

export default WebsiteSliderEdit
