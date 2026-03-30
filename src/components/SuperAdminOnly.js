import React from 'react'
import { CAlert, CSpinner } from '@coreui/react'
import { useAuth } from '../auth/AuthProvider'
import { isSuperAdminUser } from '../utils/auth'

const SuperAdminOnly = ({
  children,
  message = 'This module is available to super admins only.',
}) => {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="text-center my-4">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (!isSuperAdminUser(auth.user)) {
    return <CAlert color="warning">{message}</CAlert>
  }

  return children
}

export default SuperAdminOnly
