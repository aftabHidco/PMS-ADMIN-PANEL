// src/App.js
import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'

import { AuthProvider, useAuth } from './auth/AuthProvider'
import RequireAuth from './components/RequireAuth'

const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

function RootRedirect() {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" variant="grow" />
      </div>
    )
  }

  return auth.isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/login" replace />
}

function LoginRouteWrapper() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.loading) {
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" variant="grow" />
      </div>
    )
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Login />
}

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) setColorMode(theme)
    if (!isColorModeSet()) setColorMode(storedTheme)
  }, [])

  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<div className="pt-3 text-center"><CSpinner color="primary" /></div>}>
          <Routes>

            <Route path="/" element={<RootRedirect />} />

            {/* Public */}
            <Route path="/login" element={<LoginRouteWrapper />} />
            <Route path="/register" element={<Register />} />
            <Route path="/404" element={<Page404 />} />
            <Route path="/500" element={<Page500 />} />

            {/* Protected */}
            <Route path="/*" element={<RequireAuth><DefaultLayout /></RequireAuth>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  )
}

export default App
