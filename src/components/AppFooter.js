import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  const year = new Date().getFullYear()

  return (
    <CFooter className="px-4">
      <div>
        <a href="https://www.wbhidcoltd.com/" target="_blank" rel="noopener noreferrer">
          WBHIDCO
        </a>
        <span className="ms-1">&copy; {year}</span>
      </div>
      <div className="ms-auto">
        <a href="https://www.wbhidcoltd.com/" target="_blank" rel="noopener noreferrer">
          https://www.wbhidcoltd.com/
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
