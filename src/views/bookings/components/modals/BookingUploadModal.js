import React, { useMemo } from 'react'
import CIcon from '@coreui/icons-react'
import {
  CAlert,
  CCol,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CRow,
  CSpinner,
} from '@coreui/react'
import { cilCloudUpload, cilPlus, cilTrash, cilX } from '@coreui/icons'
import IconOnlyButton from '../../../../components/IconOnlyButton'
import {
  DOCUMENT_TYPE_OPTIONS,
  formatStatusLabel,
  getBookingCode,
  getBookingId,
} from '../../bookingListUtils'

const BookingUploadModal = ({
  visible,
  onClose,
  booking,
  people,
  onAddPerson,
  onRemovePerson,
  onPersonFieldChange,
  onPersonFilesAdd,
  onPersonFileRemove,
  uploadedDocuments,
  uploadedDocumentsLoading,
  uploadedDocumentsError,
  onSubmit,
  isActionLoading,
}) => {
  const uploadedDocumentsByPerson = useMemo(() => {
    const grouped = {}
    uploadedDocuments.forEach((doc) => {
      const personName = doc.person_name || 'Person'
      if (!grouped[personName]) grouped[personName] = []
      grouped[personName].push(doc)
    })
    return grouped
  }, [uploadedDocuments])

  const bookingId = getBookingId(booking)

  return (
    <CModal size="lg" visible={visible} onClose={onClose}>
      <CModalHeader>Upload Booking Documents</CModalHeader>
      <CModalBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <strong>Booking:</strong> {booking ? getBookingCode(booking) : '-'}
          </div>
          <IconOnlyButton
            icon={cilPlus}
            tone="primary"
            size="sm"
            label="Add Person"
            onClick={onAddPerson}
          />
        </div>

        {people.map((person, personIndex) => (
          <div key={`person-${personIndex}`} className="border rounded p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Person {personIndex + 1}</h6>
              {people.length > 1 && (
                <IconOnlyButton
                  icon={cilTrash}
                  tone="danger"
                  size="sm"
                  label="Remove Person"
                  onClick={() => onRemovePerson(personIndex)}
                />
              )}
            </div>

            <CRow className="g-2">
              <CCol md={4}>
                <CFormInput
                  label="Person Name"
                  placeholder="Enter person name"
                  value={person.person_name}
                  onChange={(e) => onPersonFieldChange(personIndex, 'person_name', e.target.value)}
                />
              </CCol>
              <CCol md={4}>
                <CFormInput
                  label="Relation (optional)"
                  placeholder="Relation with guest"
                  value={person.relation}
                  onChange={(e) => onPersonFieldChange(personIndex, 'relation', e.target.value)}
                />
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  label="Document Type"
                  value={person.document_type}
                  onChange={(e) => onPersonFieldChange(personIndex, 'document_type', e.target.value)}
                >
                  {DOCUMENT_TYPE_OPTIONS.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>

            <CFormInput
              type="file"
              multiple
              accept="image/*"
              className="mt-2"
              label="Upload Images"
              onChange={(e) => onPersonFilesAdd(personIndex, e)}
            />

            <CFormInput
              label="Note (optional)"
              className="mt-2"
              placeholder="Add note for this person's documents"
              value={person.note}
              onChange={(e) => onPersonFieldChange(personIndex, 'note', e.target.value)}
            />

            {person.files.length > 0 && (
              <>
                <div className="small text-medium-emphasis mt-2 mb-1">
                  Selected Images ({person.files.length})
                </div>
                <CRow className="g-2">
                  {person.files.map((fileItem, fileIndex) => (
                    <CCol md={3} key={`${personIndex}-${fileIndex}`}>
                      <div className="border rounded p-2 h-100">
                        <img
                          src={fileItem.preview}
                          alt="preview"
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 6,
                          }}
                        />
                        <div
                          className="small text-truncate mt-1"
                          title={fileItem.file?.name || `file-${fileIndex + 1}`}
                        >
                          {fileItem.file?.name || `file-${fileIndex + 1}`}
                        </div>
                        <IconOnlyButton
                          icon={cilTrash}
                          tone="danger"
                          size="sm"
                          className="w-100 mt-1"
                          label="Remove File"
                          onClick={() => onPersonFileRemove(personIndex, fileIndex)}
                        />
                      </div>
                    </CCol>
                  ))}
                </CRow>
              </>
            )}
          </div>
        ))}

        <hr />
        <h6>Uploaded Images</h6>

        {uploadedDocumentsLoading ? (
          <div className="text-center py-2">
            <CSpinner color="primary" />
          </div>
        ) : uploadedDocumentsError ? (
          <CAlert color="warning" className="mb-0">
            {uploadedDocumentsError}
          </CAlert>
        ) : uploadedDocuments.length === 0 ? (
          <p className="text-medium-emphasis mb-0">No uploaded documents found for this booking.</p>
        ) : (
          Object.entries(uploadedDocumentsByPerson).map(([personName, docs]) => (
            <div key={personName} className="border rounded p-2 mb-2">
              <div className="fw-semibold mb-2">{personName}</div>
              {docs.map((doc, docIndex) => (
                <div key={`${doc.document_id}-${docIndex}`} className="mb-2">
                  <div className="small text-medium-emphasis mb-1">
                    {formatStatusLabel(doc.document_type)}
                    {doc.relation ? ` | ${doc.relation}` : ''}
                    {doc.note ? ` | ${doc.note}` : ''}
                  </div>
                  {doc.file_urls.length > 0 ? (
                    <CRow className="g-2">
                      {doc.file_urls.map((url, urlIndex) => (
                        <CCol md={2} key={`${doc.document_id}-${urlIndex}`}>
                          <img
                            src={url}
                            alt="uploaded"
                            style={{
                              width: '100%',
                              height: 90,
                              objectFit: 'cover',
                              borderRadius: 6,
                              border: '1px solid #ddd',
                            }}
                          />
                        </CCol>
                      ))}
                    </CRow>
                  ) : (
                    <small className="text-medium-emphasis">No images in this document.</small>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </CModalBody>
      <CModalFooter>
        <IconOnlyButton icon={cilX} tone="default" label="Close Upload Modal" onClick={onClose} />
        <IconOnlyButton
          tone="primary"
          onClick={onSubmit}
          disabled={
            !booking ||
            isActionLoading(bookingId, 'upload') ||
            isActionLoading(bookingId, 'accept') ||
            isActionLoading(bookingId, 'cancel')
          }
          label="Upload Documents"
        >
          {booking && isActionLoading(bookingId, 'upload') ? (
            <CSpinner size="sm" />
          ) : (
            <CIcon icon={cilCloudUpload} />
          )}
        </IconOnlyButton>
      </CModalFooter>
    </CModal>
  )
}

export default React.memo(BookingUploadModal)
