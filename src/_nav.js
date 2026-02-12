import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUser,
  cilShieldAlt,
  cilPeople,
  cilUserPlus,
  cilLibraryBuilding,
  cilList,
  cilPlus,
  cilLockLocked,
  cilCreditCard,
  cilHome,        // for Property
  cilBed,  
  cilSun,       // for Rooms
  cilBan
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  // DASHBOARD
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  // USER MANAGEMENT
  {
    component: CNavTitle,
    name: 'User Management',
  },
  {
    component: CNavGroup,
    name: 'Manage Users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Manage Roles',
        to: '/roles',
        icon: <CIcon icon={cilShieldAlt} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Manage Users',
        to: '/users',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Manage Admins',
        to: '/admins',
        icon: <CIcon icon={cilUserPlus} customClassName="nav-icon" />,
      },
    ],
  },

  // PROPERTY MANAGEMENT (NEW)
  {
    component: CNavTitle,
    name: 'Property Management',
  },
  {
    component: CNavGroup,
    name: 'Properties',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Manage Properties',
        to: '/properties',
        icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
      },
    
      {
        component: CNavItem,
        name: 'Manage Room Types',
        to: '/room-types',
        icon: <CIcon icon={cilLibraryBuilding} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Manage Season',
        to: '/seasons',
        icon: <CIcon icon={cilSun} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Manage Cancellation Policy',
        to: '/cancellation',
        icon: <CIcon icon={cilBan} customClassName="nav-icon" />,
      },
    ],
  },

  // BOOKINGS
  {
    component: CNavTitle,
    name: 'Bookings',
  },
  {
    component: CNavItem,
    name: 'All Bookings',
    to: '/bookings',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Create Booking',
    to: '/bookings/create',
    icon: <CIcon icon={cilPlus} customClassName="nav-icon" />,
  },

  // LOCK SYSTEM
  {
    component: CNavItem,
    name: 'Booking Locks',
    to: '/booking-locks',
    icon: <CIcon icon={cilLockLocked} customClassName="nav-icon" />,
  },

  // PAYMENTS
  {
    component: CNavTitle,
    name: 'Payments',
  },
  {
    component: CNavItem,
    name: 'Payments',
    to: '/payments',
    icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" />,
  },
]

export default _nav
