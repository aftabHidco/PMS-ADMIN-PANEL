import React from 'react'
import CIcon from '@coreui/icons-react'
import { CButton } from '@coreui/react'

const TONE_BY_COLOR = {
  primary: 'primary',
  info: 'info',
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  secondary: 'default',
  light: 'default',
  dark: 'default',
}

const TONE_COLORS = {
  default: '#334155',
  info: '#075985',
  success: '#166534',
  primary: '#1d4ed8',
  danger: '#991b1b',
  warning: '#854d0e',
}

const TONE_BORDERS = {
  default: '#8f9ca9',
  info: '#7ca8c8',
  success: '#82b79b',
  primary: '#7f9fcf',
  danger: '#c59696',
  warning: '#ceb27d',
}

const getButtonEdge = (size) => {
  if (size === 'sm') return 32
  if (size === 'lg') return 40
  return 36
}

export const getBrushedIconButtonStyle = ({ tone = 'default', size = 'sm' } = {}) => {
  const edge = getButtonEdge(size)

  return {
    minWidth: edge,
    width: edge,
    height: edge,
    padding: 0,
    borderRadius: 10,
    transition: 'all 0.18s ease',
    color: TONE_COLORS[tone] || TONE_COLORS.default,
    border: `1px solid ${TONE_BORDERS[tone] || TONE_BORDERS.default}`,
    background:
      'linear-gradient(165deg, rgba(245,248,251,0.95) 0%, rgba(219,226,234,0.96) 46%, rgba(191,201,211,0.97) 100%), repeating-linear-gradient(112deg, rgba(255,255,255,0.24) 0 2px, rgba(145,158,171,0.14) 2px 4px)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(71,85,105,0.22), 0 2px 6px rgba(15,23,42,0.2)',
  }
}

const IconOnlyButton = React.forwardRef(function IconOnlyButton(
  {
    icon,
    label,
    tone,
    color,
    size = 'sm',
    title,
    'aria-label': ariaLabel,
    style,
    children,
    ...props
  },
  ref,
) {
  const resolvedTone = tone || TONE_BY_COLOR[color] || 'default'
  const resolvedLabel = label || ariaLabel || title || 'Action'

  return (
    <CButton
      ref={ref}
      size={size}
      title={resolvedLabel}
      aria-label={resolvedLabel}
      style={{ ...getBrushedIconButtonStyle({ tone: resolvedTone, size }), ...style }}
      {...props}
    >
      {children || (icon ? <CIcon icon={icon} /> : null)}
    </CButton>
  )
})

export default IconOnlyButton
