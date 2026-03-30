import React from 'react'
import { CToast, CToastBody, CToastClose } from '@coreui/react'

const AppToast = ({ color = 'info', title = 'Notification', message }) => {
  const useWhiteCloseButton = color !== 'warning' && color !== 'light'

  return (
    <CToast
      autohide
      delay={5000}
      color={color}
      className={useWhiteCloseButton ? 'text-white align-items-center' : 'align-items-center'}
    >
      <div className="d-flex">
        <CToastBody>
          {title ? <strong className="d-block mb-1">{title}</strong> : null}
          <div>{message}</div>
        </CToastBody>
        <CToastClose className="me-2 m-auto" white={useWhiteCloseButton} />
      </div>
    </CToast>
  )
}

export default AppToast
