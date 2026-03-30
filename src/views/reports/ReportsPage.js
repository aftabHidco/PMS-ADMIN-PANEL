import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cilChartPie,
  cilChevronLeft,
  cilChevronRight,
  cilDescription,
  cilFilter,
  cilReload,
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
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { CChartBar } from '@coreui/react-chartjs'
import { useAuth } from '../../auth/AuthProvider'
import IconOnlyButton from '../../components/IconOnlyButton'

const PER_PAGE_OPTIONS = [10, 25, 50, 100]
const PRIMARY_EXPORT_FORMAT = 'xlsx'
const SECONDARY_EXPORT_FORMATS = ['csv', 'pdf', 'json']

const STATUS_OPTIONS = ['', 'accepted', 'confirmed', 'pending', 'cancelled', 'canceled', 'expired']
const PAYMENT_STATUS_OPTIONS = [
  '',
  'pending',
  'success',
  'failed',
  'paid',
  'partial_refunded',
  'refunded',
]
const REFUND_STATUS_OPTIONS = ['', 'pending', 'processed', 'success', 'failed', 'cancelled']
const PAYMENT_MODE_OPTIONS = ['', 'cash', 'pos', 'upi', 'card', 'gateway']
const DAY_TYPE_OPTIONS = ['', 'weekday', 'weekend']
const BOOLEAN_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

const REPORT_FALLBACKS = {
  booking_register: {
    name: 'Booking Register',
    view: 'reporting.v_booking_register',
    default_sort_field: 'booking_created_at',
    default_sort_dir: 'DESC',
    date_fields: ['booking_created_at', 'checkin_date', 'checkout_date', 'cancelled_at'],
    group_by_options: ['day', 'week', 'month', 'property_name', 'room_type_name', 'booking_status'],
    default_columns: [
      'booking_code',
      'property_name',
      'guest_name',
      'checkin_date',
      'checkout_date',
      'booking_status',
      'booking_total_amount',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      { field: 'booking_status', label: 'Booking Status', type: 'select', options: STATUS_OPTIONS },
      { field: 'checkin_date', label: 'Check-in Date', type: 'date_range' },
      { field: 'booking_created_at', label: 'Booking Created', type: 'date_range' },
    ],
    metric_hints: [
      {
        field: 'booking_total_amount',
        label: 'Page Booking Value',
        format: 'currency',
        aggregate: 'sum',
      },
      { field: 'stay_nights', label: 'Avg Stay Nights', format: 'number', aggregate: 'avg' },
    ],
  },
  occupancy_inventory: {
    name: 'Occupancy Inventory',
    view: 'reporting.v_occupancy_inventory',
    default_sort_field: 'inventory_date',
    default_sort_dir: 'DESC',
    date_fields: ['inventory_date'],
    group_by_options: ['day', 'week', 'month', 'property_name', 'room_type_name'],
    default_columns: [
      'inventory_date',
      'property_name',
      'room_type_name',
      'total_units',
      'available_units',
      'booked_units',
      'occupancy_pct',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      { field: 'inventory_date', label: 'Inventory Date', type: 'date_range' },
      { field: 'room_type_id', label: 'Room Type ID', type: 'text' },
    ],
    metric_hints: [
      { field: 'occupancy_pct', label: 'Avg Occupancy', format: 'percent', aggregate: 'avg' },
      { field: 'available_units', label: 'Available Units', format: 'number', aggregate: 'sum' },
    ],
  },
  payment_collection: {
    name: 'Payment Collection',
    view: 'reporting.v_payment_collection',
    default_sort_field: 'created_at',
    default_sort_dir: 'DESC',
    date_fields: ['created_at'],
    group_by_options: ['day', 'week', 'month', 'property_name', 'payment_status', 'payment_mode'],
    default_columns: [
      'payment_id',
      'booking_code',
      'property_name',
      'guest_name',
      'payment_status',
      'payment_mode',
      'gross_amount',
      'currency',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      {
        field: 'payment_status',
        label: 'Payment Status',
        type: 'select',
        options: PAYMENT_STATUS_OPTIONS,
      },
      {
        field: 'payment_mode',
        label: 'Payment Mode',
        type: 'select',
        options: PAYMENT_MODE_OPTIONS,
      },
      { field: 'created_at', label: 'Created At', type: 'date_range' },
    ],
    metric_hints: [
      { field: 'gross_amount', label: 'Page Collection', format: 'currency', aggregate: 'sum' },
      { field: 'tax_amount', label: 'Page Tax', format: 'currency', aggregate: 'sum' },
    ],
  },
  refund_register: {
    name: 'Refund Register',
    view: 'reporting.v_refund_register',
    default_sort_field: 'created_at',
    default_sort_dir: 'DESC',
    date_fields: ['created_at', 'processed_at'],
    group_by_options: ['day', 'week', 'month', 'property_name', 'refund_status'],
    default_columns: [
      'refund_id',
      'booking_code',
      'property_name',
      'guest_name',
      'refund_status',
      'refund_amount',
      'currency',
      'processed_at',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      {
        field: 'refund_status',
        label: 'Refund Status',
        type: 'select',
        options: REFUND_STATUS_OPTIONS,
      },
      { field: 'created_at', label: 'Created At', type: 'date_range' },
    ],
    metric_hints: [
      { field: 'refund_amount', label: 'Page Refunds', format: 'currency', aggregate: 'sum' },
      { field: 'refund_id', label: 'Refund Rows', format: 'number', aggregate: 'count' },
    ],
  },
  cancellation_analysis: {
    name: 'Cancellation Analysis',
    view: 'reporting.v_cancellation_analysis',
    default_sort_field: 'cancelled_at',
    default_sort_dir: 'DESC',
    date_fields: ['cancelled_at', 'checkin_date', 'checkout_date'],
    group_by_options: ['day', 'week', 'month', 'property_name', 'cancellation_policy_name'],
    default_columns: [
      'booking_code',
      'property_name',
      'guest_name',
      'cancelled_at',
      'paid_amount',
      'refunded_amount',
      'retained_amount',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      { field: 'cancelled_at', label: 'Cancelled At', type: 'date_range' },
      { field: 'booking_status', label: 'Booking Status', type: 'select', options: STATUS_OPTIONS },
    ],
    metric_hints: [
      { field: 'refunded_amount', label: 'Refunded Value', format: 'currency', aggregate: 'sum' },
      { field: 'retained_amount', label: 'Retained Value', format: 'currency', aggregate: 'sum' },
    ],
  },
  room_type_performance: {
    name: 'Room Type Performance',
    view: 'reporting.v_room_type_performance',
    default_sort_field: 'checkin_date',
    default_sort_dir: 'DESC',
    date_fields: ['booking_created_date', 'checkin_date', 'checkout_date'],
    group_by_options: ['day', 'week', 'month', 'property_name', 'room_type_name'],
    default_columns: [
      'booking_code',
      'property_name',
      'room_type_name',
      'rooms_sold',
      'room_revenue',
      'checkin_date',
      'booking_status',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      { field: 'room_type_id', label: 'Room Type ID', type: 'text' },
      { field: 'checkin_date', label: 'Check-in Date', type: 'date_range' },
    ],
    metric_hints: [
      { field: 'room_revenue', label: 'Page Room Revenue', format: 'currency', aggregate: 'sum' },
      { field: 'rooms_sold', label: 'Rooms Sold', format: 'number', aggregate: 'sum' },
    ],
  },
  property_performance: {
    name: 'Property Performance',
    view: 'reporting.v_property_performance_daily',
    default_sort_field: 'report_date',
    default_sort_dir: 'DESC',
    date_fields: ['report_date'],
    group_by_options: ['day', 'week', 'month', 'property_name'],
    default_columns: [
      'property_name',
      'report_date',
      'bookings_created_count',
      'payments_collected',
      'refunds_issued',
      'net_cash',
      'occupancy_pct',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      { field: 'report_date', label: 'Report Date', type: 'date_range' },
    ],
    metric_hints: [
      { field: 'net_cash', label: 'Net Cash', format: 'currency', aggregate: 'sum' },
      { field: 'occupancy_pct', label: 'Avg Occupancy', format: 'percent', aggregate: 'avg' },
    ],
  },
  guest_document_compliance: {
    name: 'Guest Document Compliance',
    view: 'reporting.v_guest_document_compliance',
    default_sort_field: 'checkin_date',
    default_sort_dir: 'DESC',
    date_fields: ['checkin_date', 'checkout_date'],
    group_by_options: ['day', 'week', 'month', 'property_name', 'booking_status'],
    default_columns: [
      'booking_code',
      'property_name',
      'guest_name',
      'num_guests',
      'documented_people_count',
      'missing_guest_document_count',
      'checkin_date',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      { field: 'booking_status', label: 'Booking Status', type: 'select', options: STATUS_OPTIONS },
      { field: 'checkin_date', label: 'Check-in Date', type: 'date_range' },
    ],
    metric_hints: [
      {
        field: 'missing_guest_document_count',
        label: 'Missing Documents',
        format: 'number',
        aggregate: 'sum',
      },
      {
        field: 'documented_people_count',
        label: 'Documented Guests',
        format: 'number',
        aggregate: 'sum',
      },
    ],
  },
  pricing_matrix: {
    name: 'Pricing Matrix',
    view: 'reporting.v_pricing_matrix',
    default_sort_field: 'property_id',
    default_sort_dir: 'ASC',
    date_fields: ['created_at'],
    group_by_options: ['property_name', 'room_type_name', 'season_name', 'day_type'],
    default_columns: [
      'property_name',
      'room_type_name',
      'season_name',
      'day_type',
      'is_peak',
      'price',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      { field: 'day_type', label: 'Day Type', type: 'select', options: DAY_TYPE_OPTIONS },
      { field: 'is_peak', label: 'Peak Season', type: 'select', options: BOOLEAN_OPTIONS },
    ],
    metric_hints: [
      { field: 'price', label: 'Avg Price', format: 'currency', aggregate: 'avg' },
      { field: 'pricing_id', label: 'Pricing Rows', format: 'number', aggregate: 'count' },
    ],
  },
  tax_collection: {
    name: 'Tax Collection',
    view: 'reporting.v_tax_collection',
    default_sort_field: 'created_at',
    default_sort_dir: 'DESC',
    date_fields: ['created_at'],
    group_by_options: ['day', 'week', 'month', 'property_name', 'tax_name', 'payment_status'],
    default_columns: [
      'payment_id',
      'booking_code',
      'property_name',
      'tax_name',
      'tax_amount',
      'gross_amount',
      'payment_status',
      'created_at',
    ],
    filters: [
      { field: 'property_id', label: 'Property', type: 'select', source: 'properties' },
      {
        field: 'payment_status',
        label: 'Payment Status',
        type: 'select',
        options: PAYMENT_STATUS_OPTIONS,
      },
      { field: 'created_at', label: 'Created At', type: 'date_range' },
    ],
    metric_hints: [
      { field: 'tax_amount', label: 'Tax on Page', format: 'currency', aggregate: 'sum' },
      { field: 'gross_amount', label: 'Gross on Page', format: 'currency', aggregate: 'sum' },
    ],
  },
}

const FALLBACK_REPORT_TYPES = Object.entries(REPORT_FALLBACKS).map(([reportType, config]) => ({
  report_type: reportType,
  name: config.name,
  view: config.view,
  endpoint: `/reports/${reportType.replace(/_/g, '-')}`,
}))

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.options)) return payload.options
  return []
}

const normalizeSortDir = (value, fallback = 'DESC') => {
  const normalized = String(value || fallback).toUpperCase()
  return normalized === 'ASC' ? 'ASC' : 'DESC'
}

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const titleCase = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())

const labelizeField = (field) => {
  if (!field) return ''

  return titleCase(
    String(field)
      .replace(/\bid\b/gi, 'ID')
      .replace(/pct/gi, 'percent'),
  )
}

const isDateLikeField = (field) =>
  /(date|_at|time)$/i.test(String(field || '').trim()) ||
  String(field || '').toLowerCase() === 'report_date'

const isCurrencyField = (field) =>
  /(amount|revenue|price|cash|value|tax)/i.test(String(field || '').trim())

const isPercentField = (field) => /(percent|pct)$/i.test(String(field || '').trim())

const isBooleanField = (field) => /^(is_|has_)/i.test(String(field || '').trim())

const formatCurrency = (value, currency = 'INR') => {
  const amount = toNumber(value, 0)
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    return `${amount.toFixed(2)} ${currency || 'INR'}`
  }
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-IN', { hour12: true })
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN')
}

const formatCellValue = (field, value, row) => {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean' || isBooleanField(field)) return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ') || '-'

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch (error) {
      return '[Object]'
    }
  }

  if (isDateLikeField(field)) {
    const text = String(value)
    return text.length > 10 ? formatDateTime(value) : formatDate(value)
  }

  if (isCurrencyField(field)) {
    return formatCurrency(value, row?.currency || 'INR')
  }

  if (isPercentField(field)) {
    return `${toNumber(value, 0).toFixed(2)}%`
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-IN').format(value)
  }

  return String(value)
}

const normalizeExportRows = (body) => {
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.rows)) return body.rows
  return extractArray(body)
}

const normalizeSpreadsheetValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch (error) {
      return '[Object]'
    }
  }
  return value
}

const buildSpreadsheetMatrix = ({ rows, columnNames, availableColumns }) => {
  const columns = columnNames.length > 0 ? columnNames : resolveColumnList([], rows)
  const labels = columns.map((name) => {
    const match = availableColumns.find((column) => column.name === name)
    return match?.label || labelizeField(name)
  })

  const dataRows = rows.map((row) => columns.map((name) => normalizeSpreadsheetValue(row?.[name])))

  return [labels, ...dataRows]
}

const saveBlobAsFile = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const getFileNameFromDisposition = (contentDisposition, fallbackName) => {
  const value = String(contentDisposition || '')

  const encodedMatch = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]).split(/[\\/]/).pop() || fallbackName
    } catch (error) {
      return encodedMatch[1].split(/[\\/]/).pop() || fallbackName
    }
  }

  const plainMatch = value.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i)
  const fileName = plainMatch?.[1] || plainMatch?.[2]
  return fileName ? fileName.trim().split(/[\\/]/).pop() || fallbackName : fallbackName
}

const resolveDownloadUrl = (downloadUrl, apiBase) => {
  try {
    return new URL(downloadUrl, apiBase || window.location.origin).toString()
  } catch (error) {
    return downloadUrl
  }
}

const readResponseErrorMessage = async (response, fallbackMessage) => {
  const contentType = String(response.headers.get('content-type') || '').toLowerCase()

  if (contentType.includes('application/json')) {
    const body = await response.json().catch(() => ({}))
    return body?.message || body?.error || fallbackMessage
  }

  const text = await response.text().catch(() => '')
  return text.trim() || fallbackMessage
}

const replaceFileExtension = (fileName, extension) => {
  const safeName = String(fileName || 'report').trim() || 'report'
  const baseName = safeName.replace(/\.[^.]+$/, '')
  return `${baseName}.${extension}`
}

const hasBinarySignature = (bytes, signature) => {
  return signature.every((byte, index) => bytes[index] === byte)
}

const looksLikeHtmlDocument = (text) => {
  return text.startsWith('<!doctype html') || text.startsWith('<html')
}

const looksLikeJsonPayload = (text) => {
  return text.startsWith('{') || text.startsWith('[')
}

const looksLikeLegacySpreadsheetXml = (text) => {
  return (
    text.startsWith('<?xml') &&
    (text.includes('progid="Excel.Sheet"') ||
      text.includes('urn:schemas-microsoft-com:office:spreadsheet') ||
      text.includes('<Workbook'))
  )
}

const looksLikeDelimitedText = (text) => {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return false

  const sample = lines.slice(0, 5)
  return [',', '\t', ';'].some(
    (delimiter) =>
      sample.filter((line) => line.includes(delimiter)).length >= Math.min(2, sample.length),
  )
}

const getReportBaseName = (fileName) => {
  return String(fileName || 'report')
    .trim()
    .replace(/\.[^.]+$/, '')
}

const sanitizeWorksheetName = (value) => {
  const cleaned = String(value || 'Report')
    .replace(/[:\\/?*\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return (cleaned || 'Report').slice(0, 31)
}

const escapeHeaderFooterText = (value) => {
  return String(value || '').replace(/&/g, '&&')
}

const buildReportTitleFromFileName = (fileName) => {
  return labelizeField(getReportBaseName(fileName)) || 'Report'
}

const trimSpreadsheetMatrix = (matrix) => {
  return (Array.isArray(matrix) ? matrix : [])
    .map((row) => (Array.isArray(row) ? row : []))
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
}

const stripStyledReportRows = (matrix) => {
  const rows = trimSpreadsheetMatrix(matrix)
  if (rows.length < 4) return rows

  const secondRow = String(rows[1]?.[0] ?? '')
    .trim()
    .toLowerCase()
  const thirdRow = String(rows[2]?.[0] ?? '')
    .trim()
    .toLowerCase()

  if (secondRow.startsWith('downloaded on:') || thirdRow.includes('downloaded on:')) {
    return rows.slice(3)
  }

  return rows
}

const estimateMatrixColumnWidth = (matrix, columnIndex) => {
  const sampleRows = matrix.slice(0, 75)
  let maxLength = 12

  sampleRows.forEach((row) => {
    const value = row?.[columnIndex]
    maxLength = Math.max(maxLength, String(value ?? '').length)
  })

  return Math.min(Math.max(maxLength + 4, 14), 42)
}

const setCellBorder = (cell, color = 'D9E2F2') => {
  cell.border = {
    top: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } },
  }
}

const setCellAlignment = (cell, alignment = {}) => {
  cell.alignment = {
    vertical: 'middle',
    wrapText: true,
    ...alignment,
  }
}

const toExcelCellValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

const getWorksheetRange = (columnCount, rowNumber) => {
  const lastColumn = String.fromCharCode(64 + Math.max(1, Math.min(columnCount, 26)))
  if (columnCount > 26) {
    let dividend = Math.max(columnCount, 1)
    let label = ''
    while (dividend > 0) {
      const modulo = (dividend - 1) % 26
      label = String.fromCharCode(65 + modulo) + label
      dividend = Math.floor((dividend - modulo) / 26)
    }
    return `A${rowNumber}:${label}${rowNumber}`
  }
  return `A${rowNumber}:${lastColumn}${rowNumber}`
}

const extractFirstSheetMatrix = (XLSX, workbook) => {
  const firstSheetName = workbook?.SheetNames?.[0]
  if (!firstSheetName) return []

  const worksheet = workbook.Sheets?.[firstSheetName]
  if (!worksheet) return []

  return stripStyledReportRows(
    XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: '',
    }),
  )
}

const createStyledXlsxBlobFromMatrix = async ({ matrix, fileName, reportTitle }) => {
  const ExcelJSImport = await import('exceljs')
  const ExcelJS = ExcelJSImport?.default?.Workbook ? ExcelJSImport.default : ExcelJSImport
  const workbook = new ExcelJS.Workbook()
  const safeMatrix = trimSpreadsheetMatrix(matrix)
  const normalizedMatrix = safeMatrix.length > 0 ? safeMatrix : [['Report'], ['No data available']]
  const originalHeaders = Array.isArray(normalizedMatrix[0]) ? normalizedMatrix[0] : []
  const headers =
    originalHeaders.length > 0
      ? originalHeaders.map((header, index) => labelizeField(String(header || `Column ${index + 1}`)))
      : ['Report Value']
  const dataRows = normalizedMatrix.slice(1)
  const safeReportTitle = String(reportTitle || buildReportTitleFromFileName(fileName)).trim() || 'Report'
  const sheetName = sanitizeWorksheetName(safeReportTitle)
  const downloadedAtText = formatDateTime(new Date())
  const headerFooterTitle = escapeHeaderFooterText(safeReportTitle)
  const headerFooterDownloadedAt = escapeHeaderFooterText(downloadedAtText)
  const headerRowNumber = 5
  const dataStartRow = headerRowNumber + 1

  workbook.creator = 'PMS Admin'
  workbook.lastModifiedBy = 'PMS Admin'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: headerRowNumber }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    },
    headerFooter: {
      oddHeader: `&C&KCFD8E3&"Calibri,Bold"18 ${headerFooterTitle}`,
      oddFooter: `&C&K7A869ADownloaded on: ${headerFooterDownloadedAt}`,
    },
  })

  worksheet.mergeCells(getWorksheetRange(headers.length, 1))
  worksheet.getCell('A1').value = safeReportTitle
  worksheet.getCell('A1').font = {
    name: 'Calibri',
    size: 20,
    bold: true,
    color: { argb: 'FF1F3A5F' },
  }
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEAF2FB' },
  }
  setCellAlignment(worksheet.getCell('A1'), { horizontal: 'center' })

  worksheet.mergeCells(getWorksheetRange(headers.length, 2))
  worksheet.getCell('A2').value = `Downloaded on: ${downloadedAtText}`
  worksheet.getCell('A2').font = {
    name: 'Calibri',
    size: 11,
    italic: true,
    color: { argb: 'FF6B7280' },
  }
  worksheet.getCell('A2').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' },
  }
  setCellAlignment(worksheet.getCell('A2'), { horizontal: 'center' })

  worksheet.mergeCells(getWorksheetRange(headers.length, 3))
  worksheet.getCell('A3').value = `${safeReportTitle} | Downloaded on: ${downloadedAtText}`
  worksheet.getCell('A3').font = {
    name: 'Calibri',
    size: 16,
    bold: true,
    italic: true,
    color: { argb: 'FFD9E1EA' },
  }
  setCellAlignment(worksheet.getCell('A3'), { horizontal: 'center' })

  worksheet.getRow(1).height = 28
  worksheet.getRow(2).height = 20
  worksheet.getRow(3).height = 24
  worksheet.getRow(4).height = 6

  const headerRow = worksheet.getRow(headerRowNumber)
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = header
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    }
    setCellBorder(cell, 'FFC5D3E0')
    setCellAlignment(cell, { horizontal: 'center' })
  })
  headerRow.height = 22

  dataRows.forEach((row, rowIndex) => {
    const excelRow = worksheet.getRow(dataStartRow + rowIndex)
    const isAlternateRow = rowIndex % 2 === 1

    headers.forEach((_, columnIndex) => {
      const cell = excelRow.getCell(columnIndex + 1)
      const cellValue = toExcelCellValue(row?.[columnIndex] ?? '')
      cell.value = cellValue
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isAlternateRow ? 'FFF8FBFF' : 'FFFFFFFF' },
      }
      setCellBorder(cell)
      if (typeof cellValue === 'number') {
        cell.numFmt = Number.isInteger(cellValue) ? '#,##0' : '#,##0.00'
        setCellAlignment(cell, { horizontal: 'right' })
      } else {
        setCellAlignment(cell, { horizontal: 'left' })
      }
    })

    excelRow.height = 20
  })

  headers.forEach((_, columnIndex) => {
    worksheet.getColumn(columnIndex + 1).width = estimateMatrixColumnWidth(
      [headers, ...dataRows],
      columnIndex,
    )
  })

  worksheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: {
      row: Math.max(headerRowNumber, dataStartRow + dataRows.length - 1),
      column: headers.length,
    },
  }
  worksheet.pageSetup.printTitlesRow = `1:${headerRowNumber}`

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

const normalizeDownloadedXlsx = async ({ blob, contentType, fileName }) => {
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  if (hasBinarySignature(bytes, [0x50, 0x4b])) {
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(arrayBuffer, { type: 'array', raw: false })
      const matrix = extractFirstSheetMatrix(XLSX, workbook)

      return {
        blob: await createStyledXlsxBlobFromMatrix({
          matrix,
          fileName,
          reportTitle: buildReportTitleFromFileName(fileName),
        }),
        fileName: replaceFileExtension(fileName, 'xlsx'),
      }
    } catch (error) {
      return {
        blob,
        fileName,
      }
    }
  }

  if (hasBinarySignature(bytes, [0xd0, 0xcf, 0x11, 0xe0])) {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const matrix = extractFirstSheetMatrix(XLSX, workbook)

    return {
      blob: await createStyledXlsxBlobFromMatrix({
        matrix,
        fileName,
        reportTitle: buildReportTitleFromFileName(fileName),
      }),
      fileName: replaceFileExtension(fileName, 'xlsx'),
    }
  }

  const text = (await blob.text().catch(() => '')).trim()
  const normalizedText = text.toLowerCase()
  const normalizedContentType = String(contentType || '').toLowerCase()

  if (looksLikeHtmlDocument(normalizedText)) {
    throw new Error(
      'The XLSX export returned an HTML page instead of a spreadsheet. The export endpoint may be sending an auth/error page.',
    )
  }

  if (looksLikeJsonPayload(normalizedText)) {
    try {
      const payload = JSON.parse(text)
      const message =
        payload?.message ||
        payload?.error ||
        'The XLSX export returned JSON instead of a spreadsheet.'
      throw new Error(message)
    } catch (error) {
      if (error instanceof Error && error.message) throw error
      throw new Error('The XLSX export returned JSON instead of a spreadsheet.')
    }
  }

  if (
    looksLikeLegacySpreadsheetXml(text) ||
    normalizedContentType.includes('xml') ||
    normalizedContentType.startsWith('text/') ||
    looksLikeDelimitedText(text)
  ) {
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(text, { type: 'string' })
      const matrix = extractFirstSheetMatrix(XLSX, workbook)

      return {
        blob: await createStyledXlsxBlobFromMatrix({
          matrix,
          fileName,
          reportTitle: buildReportTitleFromFileName(fileName),
        }),
        fileName: replaceFileExtension(fileName, 'xlsx'),
      }
    } catch (error) {
      throw new Error(
        'The export looked like text/XML data, but it could not be converted into a valid XLSX file.',
      )
    }
  }

  throw new Error('The downloaded XLSX file is not a valid Excel workbook.')
}

const normalizeColumns = (meta) => {
  const source = Array.isArray(meta?.columns) ? meta.columns : []
  return source
    .map((column) => {
      if (typeof column === 'string') {
        return {
          name: column,
          label: labelizeField(column),
          data_type: 'text',
          sortable: true,
        }
      }

      const name = column?.name || column?.field
      if (!name) return null

      return {
        name,
        label: column?.label || labelizeField(name),
        data_type: column?.data_type || column?.type || 'text',
        sortable: column?.sortable !== false,
      }
    })
    .filter(Boolean)
}

const normalizeOptions = (options) => {
  return (Array.isArray(options) ? options : [])
    .map((option) => {
      if (option === null || option === undefined) return null
      if (typeof option === 'string' || typeof option === 'number') {
        return {
          value: String(option),
          label: option === '' ? 'All' : titleCase(String(option)),
        }
      }

      const value =
        option?.value ??
        option?.id ??
        option?.property_id ??
        option?.room_type_id ??
        option?.tax_id ??
        option?.season_id

      if (value === null || value === undefined) return null

      return {
        value: String(value),
        label:
          option?.label ||
          option?.name ||
          option?.property_name ||
          option?.room_type_name ||
          option?.tax_name ||
          option?.season_name ||
          String(value),
      }
    })
    .filter(Boolean)
}

const buildInitialFilters = (definitions) => {
  return (Array.isArray(definitions) ? definitions : []).reduce((accumulator, definition) => {
    if (definition?.type === 'date_range') {
      accumulator[definition.field] = { from: '', to: '' }
      return accumulator
    }

    accumulator[definition.field] = definition?.multiple ? [] : ''
    return accumulator
  }, {})
}

const normalizeFilterDefinitions = (reportType, meta) => {
  if (Array.isArray(meta?.filters) && meta.filters.length > 0) {
    return meta.filters
      .map((filter) => {
        if (!filter?.field) return null
        return {
          field: filter.field,
          label: filter.label || labelizeField(filter.field),
          type: filter.type || 'text',
          multiple: Boolean(filter.multiple),
          source: filter.source || '',
          options: normalizeOptions(filter.options),
          options_endpoint: filter.options_endpoint || '',
        }
      })
      .filter(Boolean)
  }

  const fallback = REPORT_FALLBACKS[reportType]?.filters || []
  return fallback.map((filter) => ({
    ...filter,
    label: filter.label || labelizeField(filter.field),
    options: normalizeOptions(filter.options),
    multiple: Boolean(filter.multiple),
    source: filter.source || '',
    options_endpoint: filter.options_endpoint || '',
  }))
}

const normalizeReportMeta = (reportType, reportTypes, body) => {
  const fallback = REPORT_FALLBACKS[reportType] || {}
  const typeInfo =
    (Array.isArray(reportTypes) ? reportTypes : []).find(
      (item) => item?.report_type === reportType,
    ) || {}

  const merged = {
    ...fallback,
    ...typeInfo,
    ...(body || {}),
  }

  return {
    report_type: reportType,
    name: merged?.name || fallback?.name || titleCase(reportType),
    view: merged?.view || fallback?.view || '',
    default_sort_field:
      merged?.default_sort_field ||
      fallback?.default_sort_field ||
      merged?.sort_field ||
      'created_at',
    default_sort_dir: normalizeSortDir(
      merged?.default_sort_dir || fallback?.default_sort_dir || 'DESC',
    ),
    date_fields: Array.isArray(merged?.date_fields)
      ? merged.date_fields
      : fallback?.date_fields || [],
    group_by_options:
      Array.isArray(merged?.group_by_options) && merged.group_by_options.length > 0
        ? merged.group_by_options
        : fallback?.group_by_options || [],
    default_columns:
      Array.isArray(merged?.default_columns) && merged.default_columns.length > 0
        ? merged.default_columns
        : fallback?.default_columns || [],
    metric_hints: fallback?.metric_hints || [],
    columns: normalizeColumns(merged),
    filters: normalizeFilterDefinitions(reportType, merged),
  }
}

const createPropertyOptions = (properties) => {
  const items = extractArray(properties)
  return items
    .map((property) => {
      const value = property?.property_id || property?.id
      if (!value) return null

      return {
        value: String(value),
        label: property?.property_name || property?.name || `Property ${value}`,
      }
    })
    .filter(Boolean)
}

const buildFiltersPayload = (definitions, draftFilters) => {
  const payload = {}

  ;(Array.isArray(definitions) ? definitions : []).forEach((definition) => {
    const field = definition?.field
    if (!field) return

    const value = draftFilters?.[field]

    if (definition.type === 'date_range') {
      const from = value?.from || ''
      const to = value?.to || ''
      if (from || to) {
        payload[field] = {}
        if (from) payload[field].from = from
        if (to) payload[field].to = to
      }
      return
    }

    if (definition.multiple) {
      const items = (Array.isArray(value) ? value : []).filter((item) => String(item).trim() !== '')
      if (items.length > 0) {
        payload[field] = items.map((item) => {
          const text = String(item)
          const numeric = Number(text)
          return Number.isFinite(numeric) && /_id(s)?$/i.test(field) ? numeric : text
        })
      }
      return
    }

    if (value === undefined || value === null || String(value).trim() === '') return

    if (value === 'true') {
      payload[field] = true
      return
    }

    if (value === 'false') {
      payload[field] = false
      return
    }

    const numeric = Number(value)
    payload[field] =
      Number.isFinite(numeric) && /_id$/i.test(field) ? numeric : String(value).trim()
  })

  return payload
}

const resolveColumnList = (columns, rows) => {
  if (Array.isArray(columns) && columns.length > 0) return columns
  const firstRow = Array.isArray(rows) ? rows[0] : null
  return firstRow ? Object.keys(firstRow) : []
}

const getPrimaryMeasureField = (rows, reportType) => {
  const candidates = [
    ...(REPORT_FALLBACKS[reportType]?.metric_hints || []).map((hint) => hint.field),
    'net_cash',
    'payments_collected',
    'gross_amount',
    'refund_amount',
    'refunded_amount',
    'retained_amount',
    'booking_total_amount',
    'room_revenue',
    'price',
    'tax_amount',
    'occupancy_pct',
    'rooms_sold',
    'available_units',
    'booked_units',
  ]

  const firstRow = Array.isArray(rows) ? rows[0] : null
  if (!firstRow) return ''

  return candidates.find((field) => field in firstRow) || ''
}

const groupDateValue = (value, bucket) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || '-')

  if (bucket === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  if (bucket === 'week') {
    const copy = new Date(date)
    const weekday = copy.getDay() || 7
    copy.setDate(copy.getDate() - weekday + 1)
    return copy.toISOString().slice(0, 10)
  }

  return date.toISOString().slice(0, 10)
}

const buildChartData = ({ rows, reportType, dateField, groupBy, serverChart }) => {
  if (
    serverChart?.labels?.length &&
    Array.isArray(serverChart?.datasets) &&
    serverChart.datasets.length > 0
  ) {
    return serverChart
  }

  if (!Array.isArray(rows) || rows.length === 0) return null

  const measureField = getPrimaryMeasureField(rows, reportType)
  const firstRow = rows[0]
  const candidateFields = [
    groupBy && groupBy !== 'day' && groupBy !== 'week' && groupBy !== 'month' ? groupBy : '',
    dateField,
    'report_date',
    'inventory_date',
    'booking_created_at',
    'created_at',
    'checkin_date',
    'cancelled_at',
    'processed_at',
    'property_name',
    'room_type_name',
    'booking_status',
    'payment_status',
    'refund_status',
    'tax_name',
    'season_name',
  ].filter(Boolean)

  const categoryField =
    candidateFields.find((field) => field in firstRow) || Object.keys(firstRow)[0]

  const buckets = new Map()

  rows.forEach((row) => {
    let label = row?.[categoryField]

    if (isDateLikeField(categoryField)) {
      label = groupDateValue(label, groupBy || 'day')
    } else if (groupBy === 'month' || groupBy === 'week' || groupBy === 'day') {
      const derivedDateField =
        dateField || candidateFields.find((field) => isDateLikeField(field) && field in row)
      label = derivedDateField
        ? groupDateValue(row?.[derivedDateField], groupBy)
        : row?.[categoryField]
    }

    const key = String(label || '-')
    const current = buckets.get(key) || 0
    const increment = measureField ? toNumber(row?.[measureField], 0) : 1
    buckets.set(key, current + increment)
  })

  const limitedEntries = Array.from(buckets.entries()).slice(0, 12)

  return {
    labels: limitedEntries.map(([label]) => label),
    datasets: [
      {
        label: measureField ? labelizeField(measureField) : 'Rows',
        backgroundColor: 'rgba(51, 153, 255, 0.28)',
        borderColor: '#3399ff',
        borderWidth: 1,
        data: limitedEntries.map(([, value]) => Number(value.toFixed ? value.toFixed(2) : value)),
      },
    ],
  }
}

const aggregateField = (rows, field, aggregate = 'sum') => {
  if (!Array.isArray(rows) || rows.length === 0 || !field) return null

  if (aggregate === 'count') return rows.length

  const numericValues = rows
    .map((row) => toNumber(row?.[field], Number.NaN))
    .filter((value) => Number.isFinite(value))

  if (numericValues.length === 0) return null

  if (aggregate === 'avg') {
    return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
  }

  return numericValues.reduce((sum, value) => sum + value, 0)
}

const formatMetricValue = (value, format, rows, field) => {
  if (value === null || value === undefined) return '-'
  if (format === 'currency') {
    return formatCurrency(value, rows?.[0]?.currency || 'INR')
  }
  if (format === 'percent') {
    return `${toNumber(value, 0).toFixed(2)}%`
  }
  if (format === 'number') {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value)
  }
  return formatCellValue(field, value, rows?.[0] || {})
}

const buildSummaryCards = ({
  rows,
  total,
  reportType,
  summary,
  lastGeneratedAt,
  selectedColumns,
}) => {
  const cards = []

  if (summary && typeof summary === 'object' && !Array.isArray(summary)) {
    Object.entries(summary)
      .slice(0, 4)
      .forEach(([key, value]) => {
        cards.push({
          title: labelizeField(key),
          value: formatMetricValue(
            value,
            isCurrencyField(key) ? 'currency' : isPercentField(key) ? 'percent' : 'number',
            rows,
            key,
          ),
          subtitle: lastGeneratedAt
            ? `Generated ${formatDateTime(lastGeneratedAt)}`
            : 'From API summary',
        })
      })
  }

  if (cards.length < 2) {
    cards.unshift(
      {
        title: 'Matching Rows',
        value: new Intl.NumberFormat('en-IN').format(Math.max(0, Number(total || 0))),
        subtitle: 'Total rows matching the current report filters',
      },
      {
        title: 'Page Rows',
        value: new Intl.NumberFormat('en-IN').format(rows.length),
        subtitle: `Columns selected: ${selectedColumns.length || resolveColumnList(selectedColumns, rows).length}`,
      },
    )
  }

  const hints = REPORT_FALLBACKS[reportType]?.metric_hints || []
  hints.forEach((hint) => {
    if (cards.length >= 4) return
    const aggregated = aggregateField(rows, hint.field, hint.aggregate)
    if (aggregated === null) return
    cards.push({
      title: hint.label,
      value: formatMetricValue(aggregated, hint.format, rows, hint.field),
      subtitle:
        hint.aggregate === 'avg'
          ? 'Average across visible rows'
          : hint.aggregate === 'count'
            ? 'Visible row count'
            : 'Current page aggregate',
    })
  })

  if (cards.length < 4) {
    const firstRow = rows[0] || {}
    const distinctProperties = new Set(
      rows
        .map((row) => row?.property_name || row?.property_id)
        .filter((value) => value !== undefined && value !== ''),
    ).size

    if (distinctProperties > 0) {
      cards.push({
        title: 'Properties In View',
        value: new Intl.NumberFormat('en-IN').format(distinctProperties),
        subtitle: 'Distinct properties in the current page result',
      })
    }

    if (cards.length < 4 && Object.keys(firstRow).length > 0) {
      cards.push({
        title: 'Primary Sort',
        value: labelizeField(Object.keys(firstRow)[0]),
        subtitle: lastGeneratedAt
          ? `Last refresh ${formatDateTime(lastGeneratedAt)}`
          : 'Visible data snapshot',
      })
    }
  }

  return cards.slice(0, 4)
}

const ReportsPage = () => {
  const auth = useAuth()
  const API_BASE = auth.API_BASE

  const [reportTypes, setReportTypes] = useState([])
  const [selectedReportType, setSelectedReportType] = useState('')
  const [reportMeta, setReportMeta] = useState(null)
  const [properties, setProperties] = useState([])
  const [filterOptions, setFilterOptions] = useState({})
  const [draftFilters, setDraftFilters] = useState({})
  const [appliedFilters, setAppliedFilters] = useState({})
  const [selectedColumns, setSelectedColumns] = useState([])
  const [dateField, setDateField] = useState('')
  const [groupBy, setGroupBy] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('DESC')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [serverSummary, setServerSummary] = useState(null)
  const [serverChart, setServerChart] = useState(null)
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)
  const [exportingFormat, setExportingFormat] = useState('')
  const [configReady, setConfigReady] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [lastGeneratedAt, setLastGeneratedAt] = useState('')

  const propertyOptions = useMemo(() => createPropertyOptions(properties), [properties])

  const fetchJson = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_BASE}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
          ...(options.headers || {}),
        },
        ...options,
      })

      const body = await response.json().catch(() => ({}))

      if (!response.ok || body?.success === false) {
        throw new Error(body?.message || `Failed to fetch ${path}`)
      }

      return body
    },
    [API_BASE, auth],
  )

  const loadProperties = useCallback(async () => {
    try {
      const body = await fetchJson('/properties?_perPage=500')
      setProperties(body?.data || body)
    } catch (loadError) {
      setProperties([])
    }
  }, [fetchJson])

  const loadReportTypes = useCallback(async () => {
    setLoadingTypes(true)
    setError('')
    setInfoMessage('')

    try {
      const body = await fetchJson('/reports/types')
      const items = Array.isArray(body?.data) ? body.data : extractArray(body)
      const normalized = items.length > 0 ? items : FALLBACK_REPORT_TYPES
      setReportTypes(normalized)
      setSelectedReportType((current) => current || normalized[0]?.report_type || '')
      if (items.length === 0) {
        setInfoMessage('Using the local report catalog because the API catalog returned no rows.')
      }
    } catch (loadError) {
      setReportTypes(FALLBACK_REPORT_TYPES)
      setSelectedReportType((current) => current || FALLBACK_REPORT_TYPES[0]?.report_type || '')
      setInfoMessage(
        'Using the local report catalog while the reports/types endpoint is unavailable.',
      )
    } finally {
      setLoadingTypes(false)
    }
  }, [fetchJson])

  const loadFilterOptions = useCallback(
    async (reportType, metadata) => {
      if (!metadata) return

      const nextOptions = {
        property_id: propertyOptions,
        property_ids: propertyOptions,
      }

      await Promise.allSettled(
        (metadata.filters || []).map(async (definition) => {
          if (!definition?.field || definition.type !== 'select') return
          if (definition.source === 'properties') return
          if (Array.isArray(definition.options) && definition.options.length > 0) {
            nextOptions[definition.field] = definition.options
            return
          }

          try {
            const path =
              definition.options_endpoint ||
              `/reports/filter-options?report_type=${encodeURIComponent(reportType)}&field=${encodeURIComponent(definition.field)}`
            const body = await fetchJson(path)
            const options = normalizeOptions(body?.options || body?.data || extractArray(body))
            if (options.length > 0) {
              nextOptions[definition.field] = options
            }
          } catch (loadError) {
            nextOptions[definition.field] = nextOptions[definition.field] || []
          }
        }),
      )

      setFilterOptions(nextOptions)
    },
    [fetchJson, propertyOptions],
  )

  const loadReportMeta = useCallback(
    async (reportType) => {
      if (!reportType) return

      setLoadingMeta(true)
      setConfigReady(false)
      setRows([])
      setTotal(0)
      setServerSummary(null)
      setServerChart(null)
      setLastGeneratedAt('')
      setError('')

      try {
        const body = await fetchJson(
          `/reports/filters?report_type=${encodeURIComponent(reportType)}`,
        )
        const metadata = normalizeReportMeta(reportType, reportTypes, body)
        const initialColumns =
          metadata.default_columns.length > 0
            ? metadata.default_columns
            : metadata.columns.slice(0, 8).map((column) => column.name)
        const initialFilters = buildInitialFilters(metadata.filters)

        setReportMeta(metadata)
        setSelectedColumns(initialColumns)
        setSortField(metadata.default_sort_field)
        setSortDir(metadata.default_sort_dir)
        setDateField(metadata.date_fields[0] || '')
        setGroupBy(metadata.group_by_options[0] || '')
        setDraftFilters(initialFilters)
        setAppliedFilters(initialFilters)
        setPage(1)
        await loadFilterOptions(reportType, metadata)
      } catch (loadError) {
        const metadata = normalizeReportMeta(reportType, reportTypes, {})
        const initialColumns =
          metadata.default_columns.length > 0
            ? metadata.default_columns
            : metadata.columns.slice(0, 8).map((column) => column.name)
        const initialFilters = buildInitialFilters(metadata.filters)

        setReportMeta(metadata)
        setSelectedColumns(initialColumns)
        setSortField(metadata.default_sort_field)
        setSortDir(metadata.default_sort_dir)
        setDateField(metadata.date_fields[0] || '')
        setGroupBy(metadata.group_by_options[0] || '')
        setDraftFilters(initialFilters)
        setAppliedFilters(initialFilters)
        setPage(1)
        await loadFilterOptions(reportType, metadata)
        setInfoMessage(
          'Using local filter metadata while the reports/filters endpoint is unavailable.',
        )
      } finally {
        setLoadingMeta(false)
        setConfigReady(true)
      }
    },
    [fetchJson, loadFilterOptions, reportTypes],
  )

  const loadReport = useCallback(async () => {
    if (!selectedReportType || !reportMeta || !configReady) return

    setLoadingReport(true)
    setError('')

    try {
      const payload = {
        report_type: selectedReportType,
        page,
        per_page: perPage,
        sort_field: sortField,
        sort_dir: sortDir,
        filters: buildFiltersPayload(reportMeta.filters, appliedFilters),
      }

      if (selectedColumns.length > 0) payload.columns = selectedColumns
      if (dateField) payload.date_field = dateField
      if (groupBy) payload.group_by = groupBy

      const body = await fetchJson('/reports/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const items = Array.isArray(body?.data) ? body.data : extractArray(body)
      setRows(items)
      setTotal(Number(body?.total || items.length || 0))
      setServerSummary(body?.summary || null)
      setServerChart(body?.chart || null)
      setLastGeneratedAt(body?.meta?.generated_at || body?.generated_at || new Date().toISOString())
    } catch (loadError) {
      setRows([])
      setTotal(0)
      setServerSummary(null)
      setServerChart(null)
      setError(loadError.message || 'Failed to generate report')
    } finally {
      setLoadingReport(false)
    }
  }, [
    appliedFilters,
    configReady,
    dateField,
    fetchJson,
    groupBy,
    page,
    perPage,
    reportMeta,
    selectedColumns,
    selectedReportType,
    sortDir,
    sortField,
  ])

  useEffect(() => {
    loadProperties()
    loadReportTypes()
  }, [loadProperties, loadReportTypes])

  useEffect(() => {
    if (!selectedReportType) return
    loadReportMeta(selectedReportType)
  }, [loadReportMeta, selectedReportType])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  useEffect(() => {
    setFilterOptions((current) => ({
      ...current,
      property_id: propertyOptions,
      property_ids: propertyOptions,
    }))
  }, [propertyOptions])

  const availableColumns = useMemo(() => {
    const metaColumns = Array.isArray(reportMeta?.columns) ? reportMeta.columns : []
    if (metaColumns.length > 0) return metaColumns

    const firstRow = rows[0]
    return firstRow
      ? Object.keys(firstRow).map((name) => ({
          name,
          label: labelizeField(name),
          data_type: typeof firstRow[name],
          sortable: true,
        }))
      : []
  }, [reportMeta, rows])

  const visibleColumnNames = useMemo(() => {
    return resolveColumnList(selectedColumns, rows)
  }, [rows, selectedColumns])

  const summaryCards = useMemo(
    () =>
      buildSummaryCards({
        rows,
        total,
        reportType: selectedReportType,
        summary: serverSummary,
        lastGeneratedAt,
        selectedColumns: visibleColumnNames,
      }),
    [lastGeneratedAt, rows, selectedReportType, serverSummary, total, visibleColumnNames],
  )

  const chartData = useMemo(
    () =>
      buildChartData({
        rows,
        reportType: selectedReportType,
        dateField,
        groupBy,
        serverChart,
      }),
    [dateField, groupBy, rows, selectedReportType, serverChart],
  )

  const totalPages = useMemo(() => {
    const pages = Math.ceil(Math.max(0, total) / Math.max(1, perPage))
    return Math.max(1, pages || 1)
  }, [perPage, total])

  const downloadFileResponse = useCallback(async (response, format, fallbackFileName) => {
    const blob = await response.blob()
    const fileName = getFileNameFromDisposition(
      response.headers.get('content-disposition'),
      fallbackFileName,
    )

    if (format === 'xlsx') {
      const normalized = await normalizeDownloadedXlsx({
        blob,
        contentType: response.headers.get('content-type'),
        fileName,
      })
      saveBlobAsFile(normalized.blob, normalized.fileName)
      return
    }

    saveBlobAsFile(blob, fileName)
  }, [])

  const handleFilterChange = (field, value) => {
    setDraftFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleDateRangeChange = (field, part, value) => {
    setDraftFilters((current) => ({
      ...current,
      [field]: {
        from: current?.[field]?.from || '',
        to: current?.[field]?.to || '',
        [part]: value,
      },
    }))
  }

  const handleColumnsChange = (event) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value)
    setSelectedColumns(values)
  }

  const handleApplyFilters = () => {
    setPage(1)
    setAppliedFilters({ ...draftFilters })
  }

  const handleResetFilters = () => {
    const initialFilters = buildInitialFilters(reportMeta?.filters || [])
    setPage(1)
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const handleSort = (field) => {
    if (!field) return
    if (sortField === field) {
      setSortDir((current) => (current === 'ASC' ? 'DESC' : 'ASC'))
    } else {
      setSortField(field)
      setSortDir('ASC')
    }
    setPage(1)
  }

  const exportReport = async (format) => {
    if (!selectedReportType || !reportMeta) return

    setExportingFormat(format)
    setError('')

    try {
      const payload = {
        report_type: selectedReportType,
        format,
        export_all: true,
        filters: buildFiltersPayload(reportMeta.filters, appliedFilters),
      }

      if (selectedColumns.length > 0) payload.columns = selectedColumns
      if (dateField) payload.date_field = dateField
      if (groupBy) payload.group_by = groupBy

      const response = await fetch(`${API_BASE}/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      })

      const contentType = response.headers.get('content-type') || ''

      if (!response.ok) {
        const message = await readResponseErrorMessage(
          response,
          `Failed to export ${format.toUpperCase()} report`,
        )
        throw new Error(message)
      }

      if (contentType.includes('application/json')) {
        const body = await response.json().catch(() => ({}))
        if (body?.download_url) {
          const downloadResponse = await fetch(resolveDownloadUrl(body.download_url, API_BASE), {
            headers: {
              ...auth.getAuthHeader(),
            },
            credentials: 'include',
          })

          if (!downloadResponse.ok) {
            const message = await readResponseErrorMessage(
              downloadResponse,
              `Failed to download ${format.toUpperCase()} report`,
            )
            throw new Error(message)
          }

          await downloadFileResponse(
            downloadResponse,
            format,
            body?.file_name || `${selectedReportType}.${format}`,
          )
          return
        }

        if (format === 'xlsx') {
          const exportRows = normalizeExportRows(body)
          if (exportRows.length === 0) {
            throw new Error('The export API returned JSON but no rows to build an Excel file.')
          }
          const matrix = buildSpreadsheetMatrix({
            rows: exportRows,
            columnNames: visibleColumnNames,
            availableColumns,
          })
          const styledBlob = await createStyledXlsxBlobFromMatrix({
            matrix,
            fileName: `${selectedReportType}.xlsx`,
            reportTitle: currentReportLabel,
          })
          saveBlobAsFile(styledBlob, `${selectedReportType}.xlsx`)
          return
        }

        if (format === 'csv') {
          const XLSX = await import('xlsx')
          const exportRows = normalizeExportRows(body)
          if (exportRows.length === 0) {
            throw new Error('The export API returned JSON but no rows to build a CSV file.')
          }

          const worksheet = XLSX.utils.aoa_to_sheet(
            buildSpreadsheetMatrix({
              rows: exportRows,
              columnNames: visibleColumnNames,
              availableColumns,
            }),
          )
          const csv = XLSX.utils.sheet_to_csv(worksheet)
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${selectedReportType}.csv`
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
          return
        }

        if (format === 'pdf') {
          throw new Error(
            'The export API returned JSON instead of a PDF file. Backend PDF export needs fixing.',
          )
        }

        const data = JSON.stringify(body, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${selectedReportType}.${format === 'json' ? 'json' : format}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        return
      }

      await downloadFileResponse(response, format, `${selectedReportType}.${format}`)
    } catch (exportError) {
      setError(exportError.message || `Failed to export ${format.toUpperCase()} report`)
    } finally {
      setExportingFormat('')
    }
  }

  const chartOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    }),
    [],
  )

  const currentReportLabel =
    reportTypes.find((report) => report?.report_type === selectedReportType)?.name ||
    reportMeta?.name ||
    'Report'

  return (
    <>
      <CCard className="mb-4 border-0 shadow-sm">
        <CCardBody>
          <CRow className="align-items-center g-3">
            <CCol lg={7}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <CBadge color="info">Dynamic Reports</CBadge>
                {reportMeta?.view ? <CBadge color="light">{reportMeta.view}</CBadge> : null}
              </div>
              <h3 className="mb-2">Report Studio</h3>
              <div className="text-body-secondary">
                Generate operational, revenue, occupancy, refund, and compliance reports from the
                reporting views already mapped into your PMS.
              </div>
            </CCol>
            <CCol lg={5}>
              <CRow className="g-2">
                <CCol md={6}>
                  <CFormSelect
                    label="Report Type"
                    value={selectedReportType}
                    onChange={(event) => setSelectedReportType(event.target.value)}
                    disabled={loadingTypes}
                  >
                    <option value="">Select report</option>
                    {reportTypes.map((report) => (
                      <option key={report.report_type} value={report.report_type}>
                        {report.name || titleCase(report.report_type)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    label="Per Page"
                    value={perPage}
                    onChange={(event) => {
                      setPage(1)
                      setPerPage(Number(event.target.value))
                    }}
                  >
                    {PER_PAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3} className="d-flex align-items-end">
                  <div className="d-flex gap-2 w-100 justify-content-end">
                    <IconOnlyButton
                      icon={cilReload}
                      tone="info"
                      label="Refresh Report"
                      onClick={loadReport}
                      disabled={loadingMeta || loadingReport || !selectedReportType}
                    />
                    <IconOnlyButton
                      icon={cilDescription}
                      tone="primary"
                      label="Apply Report Filters"
                      onClick={handleApplyFilters}
                      disabled={loadingMeta || !selectedReportType}
                    />
                  </div>
                </CCol>
              </CRow>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {error ? <CAlert color="danger">{error}</CAlert> : null}
      {infoMessage ? <CAlert color="info">{infoMessage}</CAlert> : null}

      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <CBadge color="primary" className="d-inline-flex align-items-center gap-1">
              <span>Filters</span>
            </CBadge>
            <span className="fw-semibold">{currentReportLabel}</span>
          </div>
          <div className="d-flex gap-2 flex-wrap justify-content-end">
            <IconOnlyButton
              icon={cilFilter}
              tone="default"
              label="Reset Filters"
              onClick={handleResetFilters}
              disabled={!reportMeta}
            />
            <CButton
              color="success"
              onClick={() => exportReport(PRIMARY_EXPORT_FORMAT)}
              disabled={!selectedReportType || exportingFormat !== '' || loadingReport}
            >
              {exportingFormat === PRIMARY_EXPORT_FORMAT ? 'Exporting Excel...' : 'Export Excel'}
            </CButton>
            {SECONDARY_EXPORT_FORMATS.map((format) => (
              <CButton
                key={format}
                color="light"
                variant="outline"
                onClick={() => exportReport(format)}
                disabled={!selectedReportType || exportingFormat !== '' || loadingReport}
              >
                {exportingFormat === format
                  ? `Exporting ${format.toUpperCase()}...`
                  : format.toUpperCase()}
              </CButton>
            ))}
          </div>
        </CCardHeader>
        <CCardBody>
          {loadingTypes || loadingMeta ? (
            <div className="text-center py-4">
              <CSpinner />
            </div>
          ) : (
            <>
              <CRow className="g-3 mb-3">
                <CCol md={4}>
                  <CFormSelect
                    label="Date Field"
                    value={dateField}
                    onChange={(event) => setDateField(event.target.value)}
                  >
                    <option value="">Auto</option>
                    {(reportMeta?.date_fields || []).map((field) => (
                      <option key={field} value={field}>
                        {labelizeField(field)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    label="Group By"
                    value={groupBy}
                    onChange={(event) => setGroupBy(event.target.value)}
                  >
                    <option value="">None</option>
                    {(reportMeta?.group_by_options || []).map((field) => (
                      <option key={field} value={field}>
                        {labelizeField(field)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    label="Visible Columns"
                    multiple
                    value={selectedColumns}
                    onChange={handleColumnsChange}
                    htmlSize={6}
                  >
                    {availableColumns.map((column) => (
                      <option key={column.name} value={column.name}>
                        {column.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="g-3">
                {(reportMeta?.filters || []).map((definition) => {
                  const optionList =
                    filterOptions?.[definition.field]?.length > 0
                      ? filterOptions[definition.field]
                      : definition.options || []

                  if (definition.type === 'date_range') {
                    return (
                      <React.Fragment key={definition.field}>
                        <CCol md={3}>
                          <CFormInput
                            type="date"
                            label={`${definition.label} From`}
                            value={draftFilters?.[definition.field]?.from || ''}
                            onChange={(event) =>
                              handleDateRangeChange(definition.field, 'from', event.target.value)
                            }
                          />
                        </CCol>
                        <CCol md={3}>
                          <CFormInput
                            type="date"
                            label={`${definition.label} To`}
                            value={draftFilters?.[definition.field]?.to || ''}
                            onChange={(event) =>
                              handleDateRangeChange(definition.field, 'to', event.target.value)
                            }
                          />
                        </CCol>
                      </React.Fragment>
                    )
                  }

                  if (definition.type === 'select') {
                    return (
                      <CCol md={definition.multiple ? 4 : 3} key={definition.field}>
                        <CFormSelect
                          label={definition.label}
                          multiple={definition.multiple}
                          value={
                            draftFilters?.[definition.field] || (definition.multiple ? [] : '')
                          }
                          onChange={(event) => {
                            if (definition.multiple) {
                              const values = Array.from(event.target.selectedOptions).map(
                                (option) => option.value,
                              )
                              handleFilterChange(definition.field, values)
                              return
                            }
                            handleFilterChange(definition.field, event.target.value)
                          }}
                          htmlSize={definition.multiple ? 5 : undefined}
                        >
                          {!definition.multiple ? <option value="">All</option> : null}
                          {optionList.map((option) => (
                            <option
                              key={`${definition.field}-${option.value}`}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>
                    )
                  }

                  return (
                    <CCol md={3} key={definition.field}>
                      <CFormInput
                        label={definition.label}
                        value={draftFilters?.[definition.field] || ''}
                        onChange={(event) =>
                          handleFilterChange(definition.field, event.target.value)
                        }
                      />
                    </CCol>
                  )
                })}
              </CRow>
            </>
          )}
        </CCardBody>
      </CCard>

      <CRow className="g-3 mb-4">
        {summaryCards.map((card) => (
          <CCol key={card.title} sm={6} xl={3}>
            <CCard className="h-100 border-0 shadow-sm">
              <CCardBody>
                <div className="text-body-secondary small text-uppercase fw-semibold">
                  {card.title}
                </div>
                <div className="fs-4 fw-semibold mt-2">{card.value}</div>
                <div className="small text-body-secondary mt-2">{card.subtitle}</div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol xl={8}>
          <CCard className="h-100">
            <CCardHeader className="d-flex align-items-center gap-2">
              <CBadge color="light">
                <span className="d-inline-flex align-items-center gap-1">
                  <span>Preview</span>
                </span>
              </CBadge>
              <span className="fw-semibold">Report Trend</span>
            </CCardHeader>
            <CCardBody style={{ minHeight: 320 }}>
              {loadingReport ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <CSpinner />
                </div>
              ) : chartData ? (
                <CChartBar data={chartData} options={chartOptions} />
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-body-secondary">
                  No chartable data available for the current result set.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xl={4}>
          <CCard className="h-100">
            <CCardHeader className="d-flex align-items-center gap-2">
              <CBadge color="light">
                <span className="d-inline-flex align-items-center gap-1">
                  <span>Context</span>
                </span>
              </CBadge>
              <span className="fw-semibold">Run Configuration</span>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-body-secondary">Report</span>
                <span className="fw-semibold text-end">{currentReportLabel}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-body-secondary">Date Field</span>
                <span>{dateField ? labelizeField(dateField) : 'Auto'}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-body-secondary">Group By</span>
                <span>{groupBy ? labelizeField(groupBy) : 'None'}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-body-secondary">Sort</span>
                <span>{`${labelizeField(sortField)} ${sortDir}`}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-body-secondary">Visible Columns</span>
                <span>{visibleColumnNames.length}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-body-secondary">Generated</span>
                <span>{lastGeneratedAt ? formatDateTime(lastGeneratedAt) : '-'}</span>
              </div>

              <div className="mt-4 p-3 rounded-3 bg-light">
                <div className="fw-semibold mb-2 d-flex align-items-center gap-2">
                  <span>API Endpoints</span>
                </div>
                <div className="small text-body-secondary">`GET /api/reports/types`</div>
                <div className="small text-body-secondary">`GET /api/reports/filters`</div>
                <div className="small text-body-secondary">`POST /api/reports/generate`</div>
                <div className="small text-body-secondary">`POST /api/reports/export`</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <CBadge color="light">
              <span className="d-inline-flex align-items-center gap-1">
                <span>Rows</span>
              </span>
            </CBadge>
            <span className="fw-semibold">{currentReportLabel} Output</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-body-secondary">
              {new Intl.NumberFormat('en-IN').format(total)} rows
            </span>
            <IconOnlyButton
              icon={cilChartPie}
              tone="default"
              label="Apply Filters and Regenerate"
              onClick={handleApplyFilters}
              disabled={loadingReport || loadingMeta}
            />
          </div>
        </CCardHeader>
        <CCardBody>
          {loadingReport ? (
            <div className="text-center py-4">
              <CSpinner />
            </div>
          ) : rows.length === 0 ? (
            <CAlert color="warning" className="mb-0">
              No rows returned for the current filter set.
            </CAlert>
          ) : (
            <>
              <div className="table-responsive">
                <CTable hover bordered small align="middle">
                  <CTableHead>
                    <CTableRow>
                      {visibleColumnNames.map((columnName) => {
                        const columnMeta = availableColumns.find(
                          (column) => column.name === columnName,
                        )
                        const sortable = columnMeta?.sortable !== false
                        const isActiveSort = sortField === columnName

                        return (
                          <CTableHeaderCell
                            key={columnName}
                            role={sortable ? 'button' : undefined}
                            onClick={sortable ? () => handleSort(columnName) : undefined}
                            style={
                              sortable
                                ? { cursor: 'pointer', whiteSpace: 'nowrap' }
                                : { whiteSpace: 'nowrap' }
                            }
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span>{columnMeta?.label || labelizeField(columnName)}</span>
                              {isActiveSort ? <CBadge color="info">{sortDir}</CBadge> : null}
                            </div>
                          </CTableHeaderCell>
                        )
                      })}
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {rows.map((row, index) => {
                      const rowKey =
                        row?.booking_id ||
                        row?.payment_id ||
                        row?.refund_id ||
                        row?.inventory_id ||
                        row?.pricing_id ||
                        `${selectedReportType}-${index}`

                      return (
                        <CTableRow key={rowKey}>
                          {visibleColumnNames.map((columnName) => (
                            <CTableDataCell
                              key={`${rowKey}-${columnName}`}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {formatCellValue(columnName, row?.[columnName], row)}
                            </CTableDataCell>
                          ))}
                        </CTableRow>
                      )
                    })}
                  </CTableBody>
                </CTable>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <div className="small text-body-secondary">
                  Page {page} of {totalPages}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <IconOnlyButton
                    icon={cilChevronLeft}
                    tone="default"
                    label="Previous Page"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || loadingReport}
                  />
                  <CButton
                    color="light"
                    size="sm"
                    disabled
                    style={{ minWidth: 84 }}
                  >{`${page}/${totalPages}`}</CButton>
                  <IconOnlyButton
                    icon={cilChevronRight}
                    tone="default"
                    label="Next Page"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages || loadingReport}
                  />
                </div>
              </div>
            </>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default ReportsPage
