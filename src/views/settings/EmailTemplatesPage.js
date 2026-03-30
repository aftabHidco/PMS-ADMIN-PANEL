import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  cilChevronLeft,
  cilChevronRight,
  cilPencil,
  cilPlus,
  cilReload,
  cilTrash,
} from '@coreui/icons'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CFormSwitch,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const PER_PAGE_OPTIONS = [10, 25, 50, 100]
const SORT_FIELD_OPTIONS = [
  { value: 'updated_at', label: 'Updated At' },
  { value: 'created_at', label: 'Created At' },
  { value: 'template_name', label: 'Template Name' },
  { value: 'template_key', label: 'Template Key' },
]
const SORT_DIR_OPTIONS = ['ASC', 'DESC']
const DEFAULT_FILTERS = {
  q: '',
  template_key: '',
  is_active: '',
}
const DEFAULT_SAMPLE_PAYLOAD = {
  user: { full_name: 'Rahul' },
  booking: { booking_code: 'BK-12345' },
}

const createEmptyForm = () => ({
  template_key: '',
  template_name: '',
  subject_template: '',
  html_template: '',
  text_template: '',
  description: '',
  placeholders_text: '',
  sample_payload_text: JSON.stringify(DEFAULT_SAMPLE_PAYLOAD, null, 2),
  is_active: true,
})

const tryParseJsonObject = (value, fallback = {}) => {
  try {
    const parsed = value && String(value).trim() ? JSON.parse(value) : fallback
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return fallback
    }
    return parsed
  } catch (error) {
    return fallback
  }
}

const inferRecipientEmail = (payload = {}) => {
  const candidatePaths = [
    'email',
    'mail_id',
    'user.email',
    'user.mail_id',
    'guest.email',
    'guest.mail_id',
    'booking.email',
  ]

  for (const path of candidatePaths) {
    const value = String(resolveTemplateValue(payload, path) || '').trim()
    if (value.includes('@')) {
      return value
    }
  }

  return ''
}

const createTestMailDraft = (source = {}) => {
  const htmlContent = source?.html_template || ''
  const textContent = String(source?.text_template || '').trim()
  const hasHtmlContent = !isRichTextEmpty(htmlContent)
  const samplePayload =
    typeof source?.sample_payload_text === 'string'
      ? tryParseJsonObject(source.sample_payload_text, DEFAULT_SAMPLE_PAYLOAD)
      : source?.sample_payload ?? DEFAULT_SAMPLE_PAYLOAD

  return {
    to: inferRecipientEmail(samplePayload),
    subject: String(source?.subject_template || '').trim() || 'Test mail from PMS',
    content:
      (hasHtmlContent ? htmlContent : textContent) || 'Hello, this is a sample email.',
    is_html: hasHtmlContent,
    sample_payload_text:
      typeof source?.sample_payload_text === 'string'
        ? source.sample_payload_text
        : toPrettyJson(samplePayload),
  }
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
  })
}

const truncateText = (value, maxLength = 90) => {
  const text = String(value || '').trim()
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

const parsePlaceholders = (value) =>
  Array.from(
    new Set(
      String(value || '')
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )

const toPrettyJson = (value) => {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch (error) {
    return JSON.stringify({}, null, 2)
  }
}

const normalizeTemplateToForm = (template) => ({
  template_key: template?.template_key || '',
  template_name: template?.template_name || '',
  subject_template: template?.subject_template || '',
  html_template: template?.html_template || '',
  text_template: template?.text_template || '',
  description: template?.description || '',
  placeholders_text: Array.isArray(template?.placeholders)
    ? template.placeholders.join('\n')
    : '',
  sample_payload_text: toPrettyJson(template?.sample_payload ?? DEFAULT_SAMPLE_PAYLOAD),
  is_active: Boolean(template?.is_active),
})

const buildListQuery = ({ page, perPage, sortField, sortDir, filters }) => {
  const params = new URLSearchParams({
    _page: String(page),
    _perPage: String(perPage),
    _sortField: sortField,
    _sortDir: sortDir,
  })

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value).trim())
    }
  })

  return params.toString()
}

const readJsonSafe = async (response) => response.json().catch(() => null)

const getErrorMessage = (body, fallbackMessage) =>
  body?.error || body?.message || fallbackMessage

const parseJsonObject = (value) => {
  const parsed = value && String(value).trim() ? JSON.parse(value) : {}
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('Sample payload must be a JSON object')
  }
  return parsed
}

const resolveTemplateValue = (payload, path) => {
  const segments = String(path || '')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)

  let current = payload
  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return undefined
    }
    current = current[segment]
  }

  if (current === undefined) return undefined
  if (current === null) return ''
  if (typeof current === 'object') return JSON.stringify(current)
  return String(current)
}

const renderTemplateWithPayload = (template, payload) =>
  String(template || '').replace(/{{\s*([^{}]+?)\s*}}/g, (match, path) => {
    const resolvedValue = resolveTemplateValue(payload, path)
    return resolvedValue === undefined ? match : resolvedValue
  })

const unwrapTemplate = (body) => {
  if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return body.data
  }
  return body || {}
}

const getStatusColor = (isActive) => (isActive ? 'success' : 'secondary')

const stripHtml = (value) =>
  String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const isRichTextEmpty = (value) => stripHtml(value).length === 0

const TOOLBAR_BUTTON_STYLE = {
  minWidth: 38,
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  background: 'linear-gradient(180deg, #ffffff 0%, #e8eef6 100%)',
  color: '#1e293b',
  fontWeight: 600,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(15,23,42,0.08)',
}

const EDITOR_SHELL_STYLE = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  overflow: 'hidden',
  background:
    'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
}

const EDITOR_TOOLBAR_STYLE = {
  borderBottom: '1px solid #e2e8f0',
  background: 'linear-gradient(180deg, #eaf1fb 0%, #dfe9f7 100%)',
  padding: '0.75rem',
}

const EDITOR_SURFACE_STYLE = {
  minHeight: 240,
  padding: '1rem',
  outline: 'none',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  color: '#0f172a',
  backgroundColor: '#ffffff',
}

const RichTextEditor = ({ label, value, onChange, placeholder }) => {
  const editorRef = useRef(null)
  const preserveSelection = (event) => event.preventDefault()

  useEffect(() => {
    if (!editorRef.current) return

    const nextValue = value || ''
    if (editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue
    }
  }, [value])

  const syncValue = useCallback(() => {
    onChange(editorRef.current?.innerHTML || '')
  }, [onChange])

  const runCommand = useCallback(
    (command, commandValue = null) => {
      if (!editorRef.current) return

      editorRef.current.focus()

      if (command === 'createLink') {
        const url = window.prompt('Enter link URL')
        if (!url) return
        document.execCommand(command, false, url)
      } else {
        document.execCommand(command, false, commandValue)
      }

      syncValue()
    },
    [syncValue],
  )

  const setBlock = useCallback(
    (tagName) => {
      if (!editorRef.current) return
      editorRef.current.focus()
      document.execCommand('formatBlock', false, tagName)
      syncValue()
    },
    [syncValue],
  )

  return (
    <div>
      <label className="form-label">{label}</label>
      <div style={EDITOR_SHELL_STYLE}>
        <div style={EDITOR_TOOLBAR_STYLE}>
          <div className="small fw-semibold text-uppercase mb-2" style={{ color: '#334155', letterSpacing: '0.04em' }}>
            Formatting Tools
          </div>
          <div className="d-flex flex-wrap gap-2">
          <CButton
            color="secondary"
            size="sm"
            style={TOOLBAR_BUTTON_STYLE}
            onMouseDown={preserveSelection}
            onClick={() => runCommand('bold')}
          >
            <strong>B</strong>
          </CButton>
          <CButton
            color="secondary"
            size="sm"
            style={TOOLBAR_BUTTON_STYLE}
            onMouseDown={preserveSelection}
            onClick={() => runCommand('italic')}
          >
            <em>I</em>
          </CButton>
          <CButton
            color="secondary"
            size="sm"
            style={TOOLBAR_BUTTON_STYLE}
            onMouseDown={preserveSelection}
            onClick={() => runCommand('underline')}
          >
            <u>U</u>
          </CButton>
          <CButton
            color="secondary"
            size="sm"
            onMouseDown={preserveSelection}
            style={TOOLBAR_BUTTON_STYLE}
            onClick={() => setBlock('h2')}
          >
            H2
          </CButton>
          <CButton
            color="secondary"
            size="sm"
            onMouseDown={preserveSelection}
            style={TOOLBAR_BUTTON_STYLE}
            onClick={() => setBlock('p')}
          >
            Paragraph
          </CButton>
          <CButton
            color="secondary"
            size="sm"
            onMouseDown={preserveSelection}
            style={TOOLBAR_BUTTON_STYLE}
            onClick={() => runCommand('insertUnorderedList')}
          >
            Bullet List
          </CButton>
          <CButton
            color="secondary"
            size="sm"
            onMouseDown={preserveSelection}
            style={TOOLBAR_BUTTON_STYLE}
            onClick={() => runCommand('insertOrderedList')}
          >
            Number List
          </CButton>
          <CButton
            color="secondary"
            size="sm"
            onMouseDown={preserveSelection}
            style={TOOLBAR_BUTTON_STYLE}
            onClick={() => runCommand('createLink')}
          >
            Link
          </CButton>
          <CButton
            color="secondary"
            size="sm"
            onMouseDown={preserveSelection}
            style={TOOLBAR_BUTTON_STYLE}
            onClick={() => runCommand('unlink')}
          >
            Remove Link
          </CButton>
          <CButton
            color="secondary"
            size="sm"
            onMouseDown={preserveSelection}
            style={TOOLBAR_BUTTON_STYLE}
            onClick={() => runCommand('removeFormat')}
          >
            Clear Format
          </CButton>
          </div>
        </div>

        <div className="position-relative">
          {isRichTextEmpty(value) ? (
            <div
              className="position-absolute top-0 start-0 p-3 text-body-tertiary"
              style={{ pointerEvents: 'none' }}
            >
              {placeholder}
            </div>
          ) : null}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            style={EDITOR_SURFACE_STYLE}
            onInput={syncValue}
            onBlur={syncValue}
          />
        </div>
      </div>
      <div className="form-text">
        Use the toolbar for formatting. The editor saves HTML directly to the template.
      </div>
    </div>
  )
}

const EmailTemplatesPage = () => {
  const auth = useAuth()
  const API_BASE = auth.API_BASE
  const authToken = auth.user?.token || localStorage.getItem('app_token') || ''

  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [total, setTotal] = useState(0)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [sortField, setSortField] = useState('updated_at')
  const [sortDir, setSortDir] = useState('DESC')

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })
  const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_FILTERS })

  const [modalVisible, setModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [form, setForm] = useState(createEmptyForm())
  const [testMailVisible, setTestMailVisible] = useState(false)
  const [testMailForm, setTestMailForm] = useState(createTestMailDraft())
  const [testMailError, setTestMailError] = useState('')
  const [testMailSuccess, setTestMailSuccess] = useState('')
  const [sendingTestMail, setSendingTestMail] = useState(false)

  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / Math.max(perPage, 1)))
  const parsedPlaceholders = parsePlaceholders(form.placeholders_text)

  const getRequestHeaders = useCallback(
    (includeContentType = true) => ({
      ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    }),
    [authToken],
  )

  const fetchTemplates = useCallback(
    async (options = {}) => {
      const nextPage = options.page ?? page
      const nextPerPage = options.perPage ?? perPage
      const nextSortField = options.sortField ?? sortField
      const nextSortDir = options.sortDir ?? sortDir
      const nextFilters = options.filters ?? appliedFilters

      setLoading(true)
      setError('')

      try {
        const query = buildListQuery({
          page: nextPage,
          perPage: nextPerPage,
          sortField: nextSortField,
          sortDir: nextSortDir,
          filters: nextFilters,
        })

        const response = await fetch(`${API_BASE}/mail-templates?${query}`, {
          headers: getRequestHeaders(),
        })
        const body = await readJsonSafe(response)

        if (!response.ok) {
          throw new Error(getErrorMessage(body, 'Failed to fetch mail templates'))
        }

        const items = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body?.data?.items)
            ? body.data.items
            : Array.isArray(body?.items)
              ? body.items
              : []

        const nextTotal = Number(body?.total ?? body?.data?.total ?? items.length)
        setTemplates(items)
        setTotal(Number.isFinite(nextTotal) ? nextTotal : items.length)
      } catch (fetchError) {
        setTemplates([])
        setTotal(0)
        setError(fetchError.message || 'Failed to fetch mail templates')
      } finally {
        setLoading(false)
      }
    },
    [API_BASE, appliedFilters, getRequestHeaders, page, perPage, sortDir, sortField],
  )

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const closeModal = () => {
    setModalVisible(false)
    setModalMode('create')
    setEditingTemplateId(null)
    setModalLoading(false)
    setSaving(false)
    setModalError('')
    setForm(createEmptyForm())
  }

  const openTestMailModal = (source = {}) => {
    setTestMailForm(createTestMailDraft(source))
    setTestMailError('')
    setTestMailSuccess('')
    setTestMailVisible(true)
  }

  const closeTestMailModal = () => {
    setTestMailVisible(false)
    setTestMailError('')
    setTestMailSuccess('')
    setSendingTestMail(false)
  }

  const applyFilters = () => {
    setPage(1)
    setAppliedFilters({ ...filters })
  }

  const clearFilters = () => {
    setPage(1)
    setFilters({ ...DEFAULT_FILTERS })
    setAppliedFilters({ ...DEFAULT_FILTERS })
  }

  const handleFilterKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      applyFilters()
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    setEditingTemplateId(null)
    setModalError('')
    setForm(createEmptyForm())
    setModalVisible(true)
  }

  const openEditModal = async (templateId) => {
    setError('')
    setSuccessMessage('')
    setModalError('')
    setModalLoading(true)

    try {
      const response = await fetch(`${API_BASE}/mail-templates/${templateId}`, {
        headers: getRequestHeaders(),
      })
      const body = await readJsonSafe(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(body, 'Failed to fetch mail template'))
      }

      setModalMode('edit')
      setEditingTemplateId(templateId)
      setForm(normalizeTemplateToForm(unwrapTemplate(body)))
      setModalVisible(true)
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to fetch mail template')
    } finally {
      setModalLoading(false)
    }
  }

  const submitForm = async () => {
    const templateKey = form.template_key.trim()
    const templateName = form.template_name.trim()
    const subjectTemplate = form.subject_template.trim()

    if (modalMode === 'create' && !templateKey) {
      setModalError('Template key is required')
      return
    }

    if (!templateName) {
      setModalError('Template name is required')
      return
    }

    if (!subjectTemplate) {
      setModalError('Subject template is required')
      return
    }

    if (isRichTextEmpty(form.html_template) && !form.text_template.trim()) {
      setModalError('Add at least one template body: HTML template or text template')
      return
    }

    let samplePayload = {}
    try {
      samplePayload = form.sample_payload_text.trim()
        ? JSON.parse(form.sample_payload_text)
        : {}
    } catch (parseError) {
      setModalError('Sample payload must be valid JSON')
      return
    }

    if (!samplePayload || Array.isArray(samplePayload) || typeof samplePayload !== 'object') {
      setModalError('Sample payload must be a JSON object')
      return
    }

    setSaving(true)
    setModalError('')
    setError('')
    setSuccessMessage('')

    try {
      const payload = {
        template_name: templateName,
        subject_template: subjectTemplate,
        html_template: form.html_template,
        text_template: form.text_template,
        description: form.description.trim(),
        placeholders: parsePlaceholders(form.placeholders_text),
        sample_payload: samplePayload,
        is_active: Boolean(form.is_active),
      }

      if (modalMode === 'create') {
        payload.template_key = templateKey
      }

      const response = await fetch(
        modalMode === 'create'
          ? `${API_BASE}/mail-templates`
          : `${API_BASE}/mail-templates/${editingTemplateId}`,
        {
          method: modalMode === 'create' ? 'POST' : 'PUT',
          headers: getRequestHeaders(),
          body: JSON.stringify(payload),
        },
      )
      const body = await readJsonSafe(response)

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            body,
            modalMode === 'create'
              ? 'Failed to create mail template'
              : 'Failed to update mail template',
          ),
        )
      }

      closeModal()
      setSuccessMessage(
        modalMode === 'create'
          ? 'Mail template created successfully'
          : 'Mail template updated successfully',
      )

      if (page !== 1) {
        setPage(1)
      } else {
        await fetchTemplates({ page: 1 })
      }
    } catch (submitError) {
      setModalError(
        submitError.message ||
          (modalMode === 'create'
            ? 'Failed to create mail template'
            : 'Failed to update mail template'),
      )
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async (template) => {
    const templateLabel = template?.template_name || template?.template_key || 'this template'
    if (!window.confirm(`Delete ${templateLabel}?`)) {
      return
    }

    setDeletingId(template.mail_template_id)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE}/mail-templates/${template.mail_template_id}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
      })
      const body = await readJsonSafe(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(body, 'Failed to delete mail template'))
      }

      setSuccessMessage(body?.message || 'Mail template deleted successfully')
      const nextPage = templates.length === 1 && page > 1 ? page - 1 : page

      if (nextPage !== page) {
        setPage(nextPage)
      } else {
        await fetchTemplates({ page: nextPage })
      }
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete mail template')
    } finally {
      setDeletingId(null)
    }
  }

  const sendDummyMail = async () => {
    const to = String(testMailForm.to || '').trim()
    const subject = String(testMailForm.subject || '').trim()
    const content = String(testMailForm.content || '')

    if (!to) {
      setTestMailError('Recipient email is required')
      setTestMailSuccess('')
      return
    }

    if (!to.includes('@')) {
      setTestMailError('Enter a valid recipient email address')
      setTestMailSuccess('')
      return
    }

    if (!subject) {
      setTestMailError('Subject is required')
      setTestMailSuccess('')
      return
    }

    if (!content.trim()) {
      setTestMailError('Content is required')
      setTestMailSuccess('')
      return
    }

    let samplePayload = {}
    try {
      samplePayload = parseJsonObject(testMailForm.sample_payload_text)
    } catch (parseError) {
      setTestMailError(parseError.message || 'Sample payload must be a JSON object')
      setTestMailSuccess('')
      return
    }

    const renderedSubject = renderTemplateWithPayload(subject, samplePayload)
    const renderedContent = renderTemplateWithPayload(content, samplePayload)

    setSendingTestMail(true)
    setTestMailError('')
    setTestMailSuccess('')

    try {
      const response = await fetch(`${API_BASE}/mail/send-sample`, {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({
          to,
          subject: renderedSubject,
          content: renderedContent,
          is_html: Boolean(testMailForm.is_html),
        }),
      })
      const body = await readJsonSafe(response)

      if (!response.ok) {
        throw new Error(getErrorMessage(body, 'Failed to send dummy mail'))
      }

      setTestMailSuccess(body?.message || 'Dummy mail sent successfully')
    } catch (sendError) {
      setTestMailError(sendError.message || 'Failed to send dummy mail')
    } finally {
      setSendingTestMail(false)
    }
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <h4 className="mb-1">Website Settings</h4>
            <div className="text-body-secondary">
              Create and maintain the email templates used across bookings and guest communication.
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <IconOnlyButton
              icon={cilReload}
              tone="info"
              label="Refresh Email Templates"
              onClick={() => fetchTemplates()}
              disabled={loading}
            />
            <CButton color="info" variant="outline" type="button" onClick={() => openTestMailModal()}>
              Dummy Send Mail
            </CButton>
            <IconOnlyButton
              icon={cilPlus}
              tone="primary"
              label="Add Email Template"
              onClick={openCreateModal}
            />
          </div>
        </CCardHeader>

        <CCardBody>
          {error ? <CAlert color="danger">{error}</CAlert> : null}
          {successMessage ? <CAlert color="success">{successMessage}</CAlert> : null}

          <CRow className="g-3 mb-4">
            <CCol lg={4} md={6}>
              <CFormInput
                label="Search"
                placeholder="Search by name, key, subject, or description"
                value={filters.q}
                onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                onKeyDown={handleFilterKeyDown}
              />
            </CCol>

            <CCol lg={3} md={6}>
              <CFormInput
                label="Template Key"
                placeholder="booking_confirmation"
                value={filters.template_key}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, template_key: event.target.value }))
                }
                onKeyDown={handleFilterKeyDown}
              />
            </CCol>

            <CCol lg={2} md={6}>
              <CFormSelect
                label="Status"
                value={filters.is_active}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, is_active: event.target.value }))
                }
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </CFormSelect>
            </CCol>

            <CCol lg={3} md={6}>
              <div className="d-flex h-100 align-items-end gap-2">
                <CButton color="primary" onClick={applyFilters}>
                  Apply Filters
                </CButton>
                <CButton color="light" variant="outline" onClick={clearFilters}>
                  Clear
                </CButton>
              </div>
            </CCol>
          </CRow>

          <CRow className="g-3 align-items-end mb-3">
            <CCol lg={2} md={4}>
              <CFormSelect
                label="Per Page"
                value={perPage}
                onChange={(event) => {
                  setPerPage(Number(event.target.value) || 25)
                  setPage(1)
                }}
              >
                {PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol lg={3} md={4}>
              <CFormSelect
                label="Sort Field"
                value={sortField}
                onChange={(event) => {
                  setSortField(event.target.value)
                  setPage(1)
                }}
              >
                {SORT_FIELD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol lg={2} md={4}>
              <CFormSelect
                label="Sort Direction"
                value={sortDir}
                onChange={(event) => {
                  setSortDir(event.target.value)
                  setPage(1)
                }}
              >
                {SORT_DIR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol lg={5} md={12}>
              <div className="text-body-secondary">
                {loading ? 'Loading templates...' : `${total} template(s) found`}
              </div>
            </CCol>
          </CRow>

          <CTable hover responsive className="align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Template</CTableHeaderCell>
                <CTableHeaderCell>Subject</CTableHeaderCell>
                <CTableHeaderCell>Placeholders</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Updated</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-5">
                    <CSpinner />
                  </CTableDataCell>
                </CTableRow>
              ) : templates.length ? (
                templates.map((template) => (
                  <CTableRow key={template.mail_template_id}>
                    <CTableDataCell>
                      <div className="fw-semibold">{template.template_name || '-'}</div>
                      <div className="text-body-secondary small">{template.template_key || '-'}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div>{truncateText(template.subject_template, 110)}</div>
                      <div className="text-body-secondary small mt-1">
                        {truncateText(template.description, 80)}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex flex-wrap gap-1">
                        {(Array.isArray(template.placeholders) ? template.placeholders : []).length ? (
                          template.placeholders.map((placeholder) => (
                            <CBadge color="info" key={placeholder}>
                              {placeholder}
                            </CBadge>
                          ))
                        ) : (
                          <span className="text-body-secondary">No placeholders</span>
                        )}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={getStatusColor(template.is_active)}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{formatDateTime(template.updated_at)}</CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex justify-content-end gap-2">
                        <IconOnlyButton
                          icon={cilPencil}
                          tone="info"
                          label="Edit Email Template"
                          onClick={() => openEditModal(template.mail_template_id)}
                          disabled={modalLoading}
                        />
                        <IconOnlyButton
                          icon={cilTrash}
                          tone="danger"
                          label="Delete Email Template"
                          onClick={() => deleteTemplate(template)}
                          disabled={deletingId === template.mail_template_id}
                        />
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-5 text-body-secondary">
                    No email templates found.
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">
            <div className="text-body-secondary">
              Page {page} of {totalPages}
            </div>

            <div className="d-flex align-items-center gap-2">
              <IconOnlyButton
                icon={cilChevronLeft}
                label="Previous Page"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={loading || page <= 1}
              />
              <IconOnlyButton
                icon={cilChevronRight}
                label="Next Page"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={loading || page >= totalPages}
              />
            </div>
          </div>
        </CCardBody>
      </CCard>

      <CModal visible={modalVisible} onClose={closeModal} size="lg" scrollable>
        <CModalHeader>
          <CModalTitle>
            {modalMode === 'create' ? 'Create Email Template' : 'Edit Email Template'}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {modalLoading ? (
            <div className="text-center py-5">
              <CSpinner />
            </div>
          ) : (
            <>
              {modalError ? <CAlert color="danger">{modalError}</CAlert> : null}

              <CAlert color="info">
                Use placeholders like <code>{'{{booking.booking_code}}'}</code> and{' '}
                <code>{'{{user.full_name}}'}</code> inside your subject and body templates.
              </CAlert>

              <CRow className="g-3">
                <CCol md={6}>
                  <CFormInput
                    label="Template Key"
                    placeholder="booking_confirmation"
                    value={form.template_key}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, template_key: event.target.value }))
                    }
                    disabled={modalMode === 'edit'}
                  />
                </CCol>

                <CCol md={6}>
                  <CFormInput
                    label="Template Name"
                    placeholder="Booking Confirmation"
                    value={form.template_name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, template_name: event.target.value }))
                    }
                  />
                </CCol>

                <CCol md={12}>
                  <CFormInput
                    label="Subject Template"
                    placeholder="Booking {{booking.booking_code}} confirmed"
                    value={form.subject_template}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, subject_template: event.target.value }))
                    }
                  />
                </CCol>

                <CCol md={12}>
                  <CFormTextarea
                    label="Description"
                    rows={2}
                    placeholder="Short note about when this template is used"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </CCol>

                <CCol lg={12}>
                  <RichTextEditor
                    label="HTML Template Editor"
                    placeholder="Write the email body here and use the toolbar to format it."
                    value={form.html_template}
                    onChange={(nextValue) =>
                      setForm((prev) => ({ ...prev, html_template: nextValue }))
                    }
                  />
                </CCol>

                <CCol lg={12}>
                  <CFormTextarea
                    label="HTML Source"
                    rows={6}
                    placeholder="<p>Hello {{user.full_name}}, your booking is confirmed.</p>"
                    value={form.html_template}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, html_template: event.target.value }))
                    }
                  />
                </CCol>

                <CCol lg={12}>
                  <CFormTextarea
                    label="Text Template"
                    rows={6}
                    placeholder="Hello {{user.full_name}}, your booking is confirmed."
                    value={form.text_template}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, text_template: event.target.value }))
                    }
                  />
                </CCol>

                <CCol lg={5}>
                  <CFormTextarea
                    label="Placeholders"
                    rows={6}
                    placeholder={'user.full_name\nbooking.booking_code'}
                    value={form.placeholders_text}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, placeholders_text: event.target.value }))
                    }
                  />
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {parsedPlaceholders.length ? (
                      parsedPlaceholders.map((placeholder) => (
                        <CBadge color="info" key={placeholder}>
                          {placeholder}
                        </CBadge>
                      ))
                    ) : (
                      <span className="text-body-secondary small">
                        Add one placeholder per line or separate them with commas.
                      </span>
                    )}
                  </div>
                </CCol>

                <CCol lg={7}>
                  <CFormTextarea
                    label="Sample Payload"
                    rows={6}
                    placeholder={JSON.stringify(DEFAULT_SAMPLE_PAYLOAD, null, 2)}
                    value={form.sample_payload_text}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, sample_payload_text: event.target.value }))
                    }
                  />
                </CCol>

                <CCol md={12}>
                  <CFormSwitch
                    label="Template is active"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, is_active: event.target.checked }))
                    }
                  />
                </CCol>
              </CRow>
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton
            color="info"
            variant="outline"
            type="button"
            onClick={() => openTestMailModal(form)}
            disabled={modalLoading || saving}
          >
            Send Dummy Mail
          </CButton>
          <CButton color="light" variant="outline" onClick={closeModal} disabled={saving}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={submitForm} disabled={saving || modalLoading}>
            {saving ? <CSpinner size="sm" /> : modalMode === 'create' ? 'Create Template' : 'Save Changes'}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={testMailVisible} onClose={closeTestMailModal}>
        <CModalHeader>
          <CModalTitle>Send Dummy Mail</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {testMailError ? <CAlert color="danger">{testMailError}</CAlert> : null}
          {testMailSuccess ? <CAlert color="success">{testMailSuccess}</CAlert> : null}

          <CAlert color="info">
            This sends a sample email using the current subject and content. Placeholders like{' '}
            <code>{'{{user.full_name}}'}</code> are replaced from the sample payload before sending.
          </CAlert>

          <CRow className="g-3">
            <CCol md={12}>
              <CFormInput
                label="To"
                type="email"
                placeholder="user@example.com"
                value={testMailForm.to}
                onChange={(event) =>
                  setTestMailForm((prev) => ({ ...prev, to: event.target.value }))
                }
              />
            </CCol>

            <CCol md={12}>
              <CFormInput
                label="Subject"
                placeholder="Test mail from PMS"
                value={testMailForm.subject}
                onChange={(event) =>
                  setTestMailForm((prev) => ({ ...prev, subject: event.target.value }))
                }
              />
            </CCol>

            <CCol md={12}>
              <CFormSwitch
                label="Send as HTML email"
                checked={testMailForm.is_html}
                onChange={(event) =>
                  setTestMailForm((prev) => ({ ...prev, is_html: event.target.checked }))
                }
              />
            </CCol>

            <CCol md={12}>
              <CFormTextarea
                label="Content"
                rows={10}
                placeholder="Hello, this is a sample email."
                value={testMailForm.content}
                onChange={(event) =>
                  setTestMailForm((prev) => ({ ...prev, content: event.target.value }))
                }
              />
            </CCol>

            <CCol md={12}>
              <CFormTextarea
                label="Sample Payload"
                rows={8}
                placeholder={JSON.stringify(DEFAULT_SAMPLE_PAYLOAD, null, 2)}
                value={testMailForm.sample_payload_text}
                onChange={(event) =>
                  setTestMailForm((prev) => ({
                    ...prev,
                    sample_payload_text: event.target.value,
                  }))
                }
              />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <div className="me-auto">
            {testMailError ? <div className="text-danger small fw-semibold">{testMailError}</div> : null}
            {!testMailError && testMailSuccess ? (
              <div className="text-success small fw-semibold">{testMailSuccess}</div>
            ) : null}
          </div>
          <CButton
            color="light"
            variant="outline"
            type="button"
            onClick={closeTestMailModal}
            disabled={sendingTestMail}
          >
            Close
          </CButton>
          <CButton color="primary" type="button" onClick={sendDummyMail} disabled={sendingTestMail}>
            {sendingTestMail ? <CSpinner size="sm" /> : 'Send Mail'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default EmailTemplatesPage
