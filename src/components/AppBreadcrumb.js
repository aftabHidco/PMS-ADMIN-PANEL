import React from 'react'
import { Link, matchPath, useLocation } from 'react-router-dom'

import routes from '../routes'

import { CBreadcrumb, CBreadcrumbItem, CLink } from '@coreui/react'

const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname

  const getRouteName = (pathname, routes) => {
    const currentRoute = routes.find((route) => {
      if (!route.path) return false
      return matchPath({ path: route.path, end: true }, pathname)
    })
    return currentRoute ? currentRoute.name : false
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    const segments = location.split('/').filter(Boolean)
    let currentPathname = ''

    segments.forEach((segment, index) => {
      currentPathname = `${currentPathname}/${segment}`
      const routeName = getRouteName(currentPathname, routes)
      routeName &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index === segments.length - 1,
        })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem>
        <CLink as={Link} to="/dashboard">
          Home
        </CLink>
      </CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <CBreadcrumbItem {...(breadcrumb.active ? { active: true } : {})} key={index}>
            {breadcrumb.active ? (
              breadcrumb.name
            ) : (
              <CLink as={Link} to={breadcrumb.pathname}>
                {breadcrumb.name}
              </CLink>
            )}
          </CBreadcrumbItem>
        )
      })}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)
