import React, { useEffect, useState } from 'react'
import { cilSave } from '@coreui/icons'
import {
  CAlert,
  CCol,
  CForm,
  CFormInput,
  CFormSwitch,
  CRow,
  CFormTextarea,
} from '@coreui/react'
import IconOnlyButton from '../../components/IconOnlyButton'
import WebsiteSliderImagePreview from './WebsiteSliderImagePreview'

const WebsiteSliderForm = ({
  mode = 'create',
  apiBase,
  error,
  form,
  onChange,
  onImagesChange,
  onImageChange,
  onSubmit,
  submitLabel,
  submitting,
}) => {
  const isCreateMode = mode === 'create'
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState('')
  const [selectedImagePreviewUrls, setSelectedImagePreviewUrls] = useState([])

  useEffect(() => {
    if (isCreateMode || !(form?.image instanceof File)) {
      setSelectedImagePreviewUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(form.image)
    setSelectedImagePreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [form?.image, isCreateMode])

  useEffect(() => {
    if (!isCreateMode) {
      setSelectedImagePreviewUrls([])
      return undefined
    }

    const images = Array.isArray(form?.images) ? form.images : []
    if (!images.length) {
      setSelectedImagePreviewUrls([])
      return undefined
    }

    const previewUrls = images
      .filter((image) => image instanceof File)
      .map((image) => ({
        name: image.name,
        url: URL.createObjectURL(image),
      }))
    setSelectedImagePreviewUrls(previewUrls)

    return () => {
      previewUrls.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [form?.images, isCreateMode])

  const previewSrc = selectedImagePreviewUrl || form?.image_url || ''
  const selectedImages = Array.isArray(form?.images) ? form.images : []

  return (
    <CForm onSubmit={onSubmit}>
      {error && <CAlert color="danger">{error}</CAlert>}

      <CRow className="mb-3">
        <CCol md={8}>
          <CFormInput
            label="Title"
            value={form.title}
            onChange={(event) => onChange('title', event.target.value)}
            placeholder="Enter slider title"
          />
        </CCol>

        <CCol md={4}>
          <CFormInput
            type="number"
            min={0}
            step={1}
            label="Display Order"
            value={form.display_order}
            onChange={(event) => onChange('display_order', event.target.value)}
            required
          />
        </CCol>
      </CRow>

      <CRow className="mb-3">
        <CCol md={12}>
          <CFormTextarea
            rows={3}
            label="Subtitle"
            value={form.subtitle}
            onChange={(event) => onChange('subtitle', event.target.value)}
            placeholder="Enter slider subtitle"
          />
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol md={12} className="mb-3">
          {isCreateMode ? (
            <>
              <CFormInput
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                label="Slider Images"
                multiple
                onChange={(event) => onImagesChange?.(Array.from(event.target.files || []))}
              />
              <div className="form-text">
                {selectedImages.length
                  ? `${selectedImages.length} image${selectedImages.length === 1 ? '' : 's'} selected`
                  : 'Select one or more JPG, PNG, or WEBP files.'}
              </div>
            </>
          ) : (
            <>
              <CFormInput
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                label="Replace Image"
                onChange={(event) => onImageChange?.(event.target.files?.[0] || null)}
              />
              <div className="form-text">
                {form?.image instanceof File
                  ? `Selected file: ${form.image.name}`
                  : form?.image_url
                    ? 'Leave empty to keep the current image.'
                    : 'Upload a JPG, PNG, or WEBP file.'}
              </div>
            </>
          )}
        </CCol>

        <CCol md={12} className="mb-3">
          <label className="form-label d-block">{isCreateMode ? 'Image Preview' : 'Current Image'}</label>
          {isCreateMode ? (
            selectedImagePreviewUrls.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                }}
              >
                {selectedImagePreviewUrls.map((preview, index) => (
                  <div key={`${preview.name}-${index}`}>
                    <WebsiteSliderImagePreview
                      src={preview.url}
                      apiBase={apiBase}
                      alt={preview.name || `Website slider preview ${index + 1}`}
                      height={160}
                    />
                    <div className="small text-body-secondary mt-1 text-truncate">{preview.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <WebsiteSliderImagePreview
                src=""
                apiBase={apiBase}
                alt="Website slider preview"
                height={220}
              />
            )
          ) : (
            <WebsiteSliderImagePreview
              src={previewSrc}
              apiBase={apiBase}
              alt={form.title || 'Website slider preview'}
              height={260}
            />
          )}
        </CCol>

        <CCol md={12} className="mb-3">
          <CFormInput
            label="Redirect URL"
            value={form.redirect_url}
            onChange={(event) => onChange('redirect_url', event.target.value)}
            placeholder="https://example.com/landing-page"
          />
        </CCol>

        <CCol md={12}>
          <CFormSwitch
            label="Active"
            checked={!!form.is_active}
            onChange={(event) => onChange('is_active', event.target.checked)}
          />
        </CCol>
      </CRow>

      <div className="d-flex justify-content-end mt-2">
        <IconOnlyButton
          icon={cilSave}
          tone="primary"
          label={submitLabel}
          title={submitLabel}
          type="submit"
          disabled={submitting}
        />
      </div>
    </CForm>
  )
}

export default WebsiteSliderForm
