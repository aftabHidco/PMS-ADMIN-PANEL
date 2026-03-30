import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  CAlert,
  CCol,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CRow,
  CSpinner,
} from '@coreui/react'
import { cilReload, cilX } from '@coreui/icons'
import IconOnlyButton from '../../../../components/IconOnlyButton'
import {
  calculateCancellationAmounts,
  CUSTOM_POLICY_VALUE,
  formatCurrency,
  formatDate,
  formatDateTime,
  getBookingCode,
  getBookingId,
  getCheckinDate,
  getCheckoutDate,
  getCreatedAt,
  getGuestName,
  getPropertyName,
  toNumber,
} from '../../bookingListUtils'

const BookingRefundModal = ({
  visible,
  onClose,
  booking,
  loading,
  error,
  cancellationPolicies,
  policyId,
  onPolicyChange,
  refundContext,
  appliedCancellation,
  eligibility,
  refundForm,
  setRefundForm,
  setRefundAmountTouched,
  onSubmit,
  isActionLoading,
  propertyMap,
}) => {
  const refundPayments = Array.isArray(eligibility?.payments) ? eligibility.payments : []
  const selectedRefundPayment =
    refundPayments.find((payment) => String(payment?.payment_id) === String(refundForm.payment_id)) ||
    refundPayments[0] ||
    null
  const selectedRefundCalculation = selectedRefundPayment?.calculation || {}
  const selectedPolicyCalculation = appliedCancellation?.calculation || {}
  const isCustomPolicy = policyId === CUSTOM_POLICY_VALUE

  const bookingAmountForRefund = toNumber(
    refundContext?.booking_amount ??
      selectedPolicyCalculation?.booking_amount ??
      selectedRefundCalculation?.payment_amount,
    0,
  )
  const effectiveDeductionPercentage = isCustomPolicy
    ? Math.max(0, Math.min(100, toNumber(refundForm.custom_deduction_percentage, 0)))
    : toNumber(
        selectedPolicyCalculation?.deduction_percentage ??
          selectedRefundCalculation?.deduction_percentage,
        0,
      )
  const paymentAmountForPolicy = toNumber(
    selectedRefundCalculation?.payment_amount ?? bookingAmountForRefund,
    0,
  )
  const policyPaymentCalc = calculateCancellationAmounts(
    paymentAmountForPolicy,
    effectiveDeductionPercentage,
  )
  const policyBookingBreakdown = calculateCancellationAmounts(
    bookingAmountForRefund,
    effectiveDeductionPercentage,
  )
  const effectiveMaxRefundable = toNumber(policyPaymentCalc?.refund_amount, 0)
  const effectiveRemainingRefundable = (() => {
    const remaining = toNumber(selectedRefundCalculation?.refundable_remaining_amount, 0)
    if (effectiveMaxRefundable > 0 && remaining > 0) return Math.min(remaining, effectiveMaxRefundable)
    return effectiveMaxRefundable > 0 ? effectiveMaxRefundable : remaining
  })()

  const handleCustomDeductionChange = (event) => {
    if (!isCustomPolicy) return
    setRefundAmountTouched(true)
    const nextValue = event.target.value
    const parsed = Number(nextValue)
    const safeDeduction = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0
    const baseAmount = toNumber(refundContext?.booking_amount, 0)
    const computedRefund = calculateCancellationAmounts(baseAmount, safeDeduction).refund_amount
    const paymentRemaining = toNumber(selectedRefundCalculation?.refundable_remaining_amount, 0)
    const clampedRefund =
      paymentRemaining > 0 ? Math.min(paymentRemaining, computedRefund) : computedRefund
    setRefundForm((prev) => ({
      ...prev,
      custom_deduction_percentage: nextValue,
      refund_amount: clampedRefund > 0 ? String(clampedRefund) : '',
    }))
  }

  const bookingId = getBookingId(booking)
  const refundDisabled =
    !booking ||
    loading ||
    !policyId ||
    eligibility?.can_refund === false ||
    refundPayments.length === 0 ||
    !refundForm.payment_id ||
    !refundForm.refund_amount ||
    !refundForm.refund_reason.trim() ||
    isActionLoading(bookingId, 'refund') ||
    isActionLoading(bookingId, 'accept') ||
    isActionLoading(bookingId, 'cancel') ||
    isActionLoading(bookingId, 'upload')

  return (
    <CModal size="lg" visible={visible} onClose={onClose}>
      <CModalHeader>Create Refund</CModalHeader>
      <CModalBody>
        <CRow className="g-2 mb-2">
          <CCol md={4}>
            <div className="small text-muted">Booking</div>
            <div className="fw-semibold">{booking ? getBookingCode(booking) : '-'}</div>
          </CCol>
          <CCol md={4}>
            <div className="small text-muted">User Name</div>
            <div className="fw-semibold">{booking ? getGuestName(booking) : '-'}</div>
          </CCol>
          <CCol md={4}>
            <div className="small text-muted">Property Name</div>
            <div className="fw-semibold">
              {booking ? getPropertyName(booking, propertyMap || {}) : '-'}
            </div>
          </CCol>
          <CCol md={4}>
            <div className="small text-muted">Booking Date</div>
            <div className="fw-semibold">
              {booking ? formatDateTime(getCreatedAt(booking)) : '-'}
            </div>
          </CCol>
          <CCol md={4}>
            <div className="small text-muted">Stay Date</div>
            <div className="fw-semibold">
              {booking
                ? `${formatDate(getCheckinDate(booking))} - ${formatDate(getCheckoutDate(booking))}`
                : '-'}
            </div>
          </CCol>
        </CRow>

        {error && (
          <CAlert color="warning" className="mb-2">
            {error}
          </CAlert>
        )}
        {cancellationPolicies.length === 0 && (
          <CAlert color="warning" className="mb-2">
            No cancellation policy found. Please create one before processing refund.
          </CAlert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <CSpinner color="primary" />
          </div>
        ) : (
          <>
            <CRow className="g-2 mb-2 align-items-end">
              <CCol md={4}>
                <CFormSelect
                  label="Cancellation Policy"
                  className="mb-0"
                  value={policyId}
                  onChange={(e) => onPolicyChange(e.target.value)}
                  disabled={cancellationPolicies.length === 0 || loading}
                >
                  <option value="">Select cancellation policy</option>
                  {cancellationPolicies.map((policy) => {
                    const policyOptionId = policy?.id
                    if (!policyOptionId) return null
                    const deduction = policy?.deduction_percentage
                    const deductionText = Number.isFinite(Number(deduction))
                      ? `${Number(deduction)}%`
                      : '-'
                    return (
                      <option key={policyOptionId} value={String(policyOptionId)}>
                        {policy?.name || String(policyOptionId)} ({deductionText} deduction)
                      </option>
                    )
                  })}
                  <option value={CUSTOM_POLICY_VALUE}>Custom (enter deduction %)</option>
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormInput
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  label="Deduction Percentage (%)"
                  className="mb-0"
                  value={
                    isCustomPolicy
                      ? refundForm.custom_deduction_percentage
                      : String(toNumber(effectiveDeductionPercentage, 0))
                  }
                  onChange={handleCustomDeductionChange}
                  readOnly={!isCustomPolicy}
                  disabled={eligibility?.can_refund === false || refundPayments.length === 0}
                />
              </CCol>
              <CCol md={4}>
                <CFormInput
                  type="number"
                  min={0}
                  max={effectiveRemainingRefundable > 0 ? effectiveRemainingRefundable : undefined}
                  step="0.01"
                  label="Refund Amount"
                  className="mb-0"
                  value={refundForm.refund_amount}
                  readOnly
                  disabled={eligibility?.can_refund === false || refundPayments.length === 0}
                />
              </CCol>
            </CRow>

            {selectedRefundPayment && (
              <div
                className="border rounded p-2 small mb-3"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  borderColor: '#e7ebf0',
                  boxShadow: '0 1px 2px rgba(16,24,40,0.06)',
                }}
              >
                <div className="fw-semibold mb-1" style={{ color: '#334155' }}>
                  Eligibility Details
                </div>
                <div className="d-grid gap-1">
                  <div
                    className="d-flex justify-content-between align-items-center px-2 py-1 rounded"
                    style={{ background: '#eef6ff' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#0d6efd',
                        }}
                      />
                      <span className="text-muted">Total Amount</span>
                    </div>
                    <span className="fw-semibold" style={{ color: '#0f172a' }}>
                      {formatCurrency(bookingAmountForRefund)}
                    </span>
                  </div>
                  <div
                    className="d-flex justify-content-between align-items-center px-2 py-1 rounded"
                    style={{ background: '#fff4e6' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#f59f00',
                        }}
                      />
                      <span className="text-muted">Deduction %</span>
                    </div>
                    <span className="fw-semibold" style={{ color: '#7c2d12' }}>
                      {toNumber(effectiveDeductionPercentage, 0)}%
                    </span>
                  </div>
                  <div
                    className="d-flex justify-content-between align-items-center px-2 py-1 rounded"
                    style={{ background: '#e9f7ef' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#2f9e44',
                        }}
                      />
                      <span className="text-muted">Refund Amount</span>
                    </div>
                    <span className="fw-semibold" style={{ color: '#14532d' }}>
                      {formatCurrency(policyBookingBreakdown?.refund_amount)}
                    </span>
                  </div>
                  <div
                    className="d-flex justify-content-between align-items-center px-2 py-1 rounded"
                    style={{ background: '#fff0f0' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#d9480f',
                        }}
                      />
                      <span className="text-muted">Deduction Amount</span>
                    </div>
                    <span className="fw-semibold" style={{ color: '#7f1d1d' }}>
                      {formatCurrency(policyBookingBreakdown?.deduction_amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <CRow className="g-2">
              <CCol md={12}>
                <CFormTextarea
                  label="Refund Reason"
                  rows={3}
                  value={refundForm.refund_reason}
                  onChange={(e) =>
                    setRefundForm((prev) => ({ ...prev, refund_reason: e.target.value }))
                  }
                  disabled={eligibility?.can_refund === false || refundPayments.length === 0}
                />
              </CCol>
            </CRow>
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <IconOnlyButton icon={cilX} tone="default" label="Close Refund Modal" onClick={onClose} />
        <IconOnlyButton
          tone="warning"
          onClick={onSubmit}
          disabled={refundDisabled}
          label="Confirm Refund"
        >
          {booking && isActionLoading(bookingId, 'refund') ? (
            <CSpinner size="sm" />
          ) : (
            <CIcon icon={cilReload} />
          )}
        </IconOnlyButton>
      </CModalFooter>
    </CModal>
  )
}

export default React.memo(BookingRefundModal)
