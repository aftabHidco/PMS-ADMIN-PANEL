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
  cilReload,
  cilHome,        // for Property
  cilBed,  
  cilSun,       // for Rooms
  cilBan,
  cilDescription,
  cilEnvelopeClosed,
  cilImage
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
        name: 'Room Type Masters',
        to: '/room-type-masters',
        icon: <CIcon icon={cilLibraryBuilding} customClassName="nav-icon" />,
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
  {
    component: CNavItem,
    name: 'Room Inventory',
    to: '/room-inventory',
    icon: <CIcon icon={cilBed} customClassName="nav-icon" />,
  },

  // PAYMENTS
  {
    component: CNavTitle,
    name: 'Payments & Refunds',
  },
  {
    component: CNavItem,
    name: 'Payments',
    to: '/payments',
    icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Refunds',
    to: '/refunds',
    icon: <CIcon icon={cilReload} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Reporting',
  },
  {
    component: CNavItem,
    name: 'Reports',
    to: '/reports',
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Website Settings',
  },
  {
    component: CNavItem,
    name: 'Email Templates',
    to: '/website-settings/email-templates',
    icon: <CIcon icon={cilEnvelopeClosed} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Website Sliders',
    to: '/website-sliders',
    roles: ['super_admin'],
    icon: <CIcon icon={cilImage} customClassName="nav-icon" />,
  },
]

export default _nav
