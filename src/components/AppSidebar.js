import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'

import { AppSidebarNav } from './AppSidebarNav'
import { useAuth } from '../auth/AuthProvider'
import { getUserRole, normalizeRole } from '../utils/auth'

const HIDCO_LOGO_URL = 'https://www.wbhidcoltd.com/assets/frontend/img/logo.jpg'

// sidebar nav config
import navigation from '../_nav'

const AppSidebar = () => {
  const auth = useAuth()
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const userRole = getUserRole(auth.user)

  const navigationItems = useMemo(() => {
    const filterItems = (items) =>
      items.reduce((acc, item) => {
        const allowedRoles = Array.isArray(item.roles) ? item.roles.map(normalizeRole) : null
        if (allowedRoles && !allowedRoles.includes(userRole)) {
          return acc
        }

        if (Array.isArray(item.items)) {
          const visibleItems = filterItems(item.items)
          if (!visibleItems.length) {
            return acc
          }

          acc.push({ ...item, items: visibleItems })
          return acc
        }

        acc.push(item)
        return acc
      }, [])

    return filterItems(navigation)
  }, [userRole])

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/" className="d-flex justify-content-center align-items-center py-2">
          <img
            src={HIDCO_LOGO_URL}
            alt="HIDCO"
            className="sidebar-brand-full"
            style={{ width: '170px', height: '48px', objectFit: 'contain' }}
          />
          <img
            src={HIDCO_LOGO_URL}
            alt="HIDCO"
            className="sidebar-brand-narrow"
            style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '4px' }}
          />
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      <AppSidebarNav items={navigationItems} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
