import React, { useEffect, useState } from 'react'
import { CSpinner } from '@coreui/react'
import { resolveWebsiteSliderImageUrl } from './websiteSliderUtils'

const emptyStateStyle = {
  border: '1px solid #d8dbe0',
  borderRadius: 12,
  backgroundColor: '#f8fafc',
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '1rem',
}

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const WebsiteSliderImagePreview = ({
  src,
  apiBase,
  alt = 'Website slider image',
  width = '100%',
  height = 180,
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const resolvedSrc = resolveWebsiteSliderImageUrl(src, apiBase)

  useEffect(() => {
    setHasError(false)
    setIsLoading(Boolean(resolvedSrc))
  }, [resolvedSrc])

  if (!resolvedSrc || hasError) {
    return (
      <div style={{ ...emptyStateStyle, width, height }}>
        {resolvedSrc ? 'Image preview unavailable' : 'Add an image URL to preview the slider'}
      </div>
    )
  }

  return (
    <div
      style={{
        border: '1px solid #d8dbe0',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        width,
        height,
        backgroundColor: '#f8fafc',
      }}
    >
      {isLoading ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(248, 250, 252, 0.88)',
            zIndex: 1,
          }}
        >
          <CSpinner color="primary" />
        </div>
      ) : null}
      <img
        src={resolvedSrc}
        alt={alt}
        style={{ ...imageStyle, opacity: isLoading ? 0 : 1, transition: 'opacity 0.2s ease' }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}

export default WebsiteSliderImagePreview
