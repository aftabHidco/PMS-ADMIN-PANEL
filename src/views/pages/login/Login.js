// src/views/pages/login/Login.js
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { useAuth } from '../../../auth/AuthProvider'

const Login = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Email instead of username
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Where to redirect after login
  const from = location.state?.from?.pathname || '/'

  // If already authenticated, push user to dashboard/home
  useEffect(() => {
    if (!auth.loading && auth.isAuthenticated) {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.isAuthenticated])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await auth.login({ email: email.trim(), password })

      if (res && res.ok) {
        navigate(from, { replace: true })
      } else {
        setError(res?.message || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Login error', err)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>

                    {error && (
                      <CAlert color="danger" className="py-2">
                        {error}
                      </CAlert>
                    )}

                    {/* EMAIL FIELD */}
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Email"
                        autoComplete="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </CInputGroup>

                    {/* PASSWORD FIELD */}
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol xs={6}>
                        <CButton
                          color="primary"
                          className="px-4"
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? 'Signing in...' : 'Login'}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>

              {/* RIGHT SIDE CARD */}
              <CCard className="text-white bg-success py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>WBHDICO</h2>
                    <p>Property Management System</p>
                    <img
                      src="https://www.wbhidcoltd.com/assets/frontend/img/logo.jpg"
                      alt="WBHIDCO Logo"
                      style={{
                        width: '120px',
                        marginTop: '15px',
                        background: 'white',
                        borderRadius: '6px',
                        padding: '8px',
                      }}
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
