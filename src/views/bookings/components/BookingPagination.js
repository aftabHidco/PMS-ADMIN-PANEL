import React from 'react'
import { cilChevronLeft, cilChevronRight } from '@coreui/icons'
import IconOnlyButton from '../../../components/IconOnlyButton'

const BookingPagination = ({ page, totalPages, onPrev, onNext }) => (
  <div className="d-flex justify-content-between mt-3">
    <IconOnlyButton
      icon={cilChevronLeft}
      tone="default"
      size="sm"
      disabled={page === 1}
      onClick={onPrev}
      label="Previous Page"
    />

    <span>
      Page {page} of {totalPages}
    </span>

    <IconOnlyButton
      icon={cilChevronRight}
      tone="default"
      size="sm"
      disabled={page === totalPages}
      onClick={onNext}
      label="Next Page"
    />
  </div>
)

export default React.memo(BookingPagination)
