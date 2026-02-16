import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { CContainer, CHeader, CHeaderToggler, useColorModes } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilAccountLogout, cilMenu, cilMoon, cilSun } from '@coreui/icons'

import { useAuth } from '../auth/AuthProvider'
import IconOnlyButton from './IconOnlyButton'

const AppHeader = () => {
  const headerRef = useRef()
  const navigate = useNavigate()
  const auth = useAuth()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const userName =
    auth?.user?.full_name || auth?.user?.name || auth?.user?.email || auth?.user?.role || 'User'
  const userInitial = userName?.charAt(0)?.toUpperCase() || 'U'
  const activeMode = colorMode === 'dark' ? 'dark' : 'light'

  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  useEffect(() => {
    const handleScroll = () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    }

    document.addEventListener('scroll', handleScroll)
    return () => document.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('app_token')
    localStorage.removeItem('app_user')
    auth.logout()
    navigate('/login', { replace: true })
  }

  return (
    <CHeader position="sticky" className="mb-2 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-3 py-2 d-flex align-items-center gap-2" fluid>
        <CHeaderToggler
          className="border rounded-circle d-flex align-items-center justify-content-center"
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{
            width: '34px',
            height: '34px',
            backgroundColor: 'var(--cui-body-bg)',
            marginInlineStart: 0,
          }}
        >
          <CIcon icon={cilMenu} />
        </CHeaderToggler>
        <div className="ms-auto d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center rounded-pill p-1 border shadow-sm"
            style={{ backgroundColor: 'var(--cui-body-bg)' }}
          >
            <IconOnlyButton
              icon={cilSun}
              tone={activeMode === 'light' ? 'primary' : 'default'}
              label="Light Mode"
              size="sm"
              className="rounded-circle p-1 d-flex align-items-center justify-content-center"
              style={{ width: '30px', height: '30px', opacity: activeMode === 'light' ? 1 : 0.75 }}
              onClick={() => setColorMode('light')}
            />
            <IconOnlyButton
              icon={cilMoon}
              tone={activeMode === 'dark' ? 'primary' : 'default'}
              label="Dark Mode"
              size="sm"
              className="rounded-circle p-1 d-flex align-items-center justify-content-center"
              style={{ width: '30px', height: '30px', opacity: activeMode === 'dark' ? 1 : 0.75 }}
              onClick={() => setColorMode('dark')}
            />
          </div>

          <div
            className="d-flex align-items-center gap-2 px-2 py-1 rounded-3 border shadow-sm"
            style={{
              maxWidth: '250px',
              background:
                colorMode === 'dark'
                  ? 'linear-gradient(90deg, rgba(27,32,36,0.95), rgba(43,50,57,0.95))'
                  : 'linear-gradient(90deg, rgba(255,255,255,1), rgba(243,246,250,1))',
            }}
            title={userName}
          >
            <div
              className="rounded-2 d-flex align-items-center justify-content-center fw-bold text-white"
              style={{
                width: '26px',
                height: '26px',
                backgroundColor: 'var(--cui-primary)',
                fontSize: '12px',
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>
            <span className="fw-semibold text-truncate" style={{ fontSize: '0.88rem' }}>
              {userName}
            </span>
          </div>
          <IconOnlyButton
            icon={cilAccountLogout}
            tone="danger"
            label="Logout"
            size="sm"
            className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '34px', height: '34px' }}
            onClick={handleLogout}
          />
        </div>
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
