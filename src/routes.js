import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))

// Base
const Accordion = React.lazy(() => import('./views/base/accordion/Accordion'))
const Breadcrumbs = React.lazy(() => import('./views/base/breadcrumbs/Breadcrumbs'))
const Cards = React.lazy(() => import('./views/base/cards/Cards'))
const Carousels = React.lazy(() => import('./views/base/carousels/Carousels'))
const Collapses = React.lazy(() => import('./views/base/collapses/Collapses'))
const ListGroups = React.lazy(() => import('./views/base/list-groups/ListGroups'))
const Navs = React.lazy(() => import('./views/base/navs/Navs'))
const Paginations = React.lazy(() => import('./views/base/paginations/Paginations'))
const Placeholders = React.lazy(() => import('./views/base/placeholders/Placeholders'))
const Popovers = React.lazy(() => import('./views/base/popovers/Popovers'))
const Progress = React.lazy(() => import('./views/base/progress/Progress'))
const Spinners = React.lazy(() => import('./views/base/spinners/Spinners'))
const Tabs = React.lazy(() => import('./views/base/tabs/Tabs'))
const Tables = React.lazy(() => import('./views/base/tables/Tables'))
const Tooltips = React.lazy(() => import('./views/base/tooltips/Tooltips'))

// Buttons
const Buttons = React.lazy(() => import('./views/buttons/buttons/Buttons'))
const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups'))
const Dropdowns = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns'))

//Forms
const ChecksRadios = React.lazy(() => import('./views/forms/checks-radios/ChecksRadios'))
const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels'))
const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup'))
const Layout = React.lazy(() => import('./views/forms/layout/Layout'))
const Range = React.lazy(() => import('./views/forms/range/Range'))
const Select = React.lazy(() => import('./views/forms/select/Select'))
const Validation = React.lazy(() => import('./views/forms/validation/Validation'))

const Charts = React.lazy(() => import('./views/charts/Charts'))

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

// Notifications
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))

const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

//user

const UsersList = React.lazy(() => import('./views/users/UsersList'))
const UserCreate = React.lazy(() => import('./views/users/UserCreate'))
const UserEdit = React.lazy(() => import('./views/users/UserEdit'))

//role

const RoleList = React.lazy(() => import('./views/roles/RoleList'))
const RoleCreate = React.lazy(() => import('./views/roles/RoleCreate'))
const RoleEdit = React.lazy(() => import('./views/roles/RoleEdit'))

//admin

const AdminList = React.lazy(() => import('./views/admin/AdminList'))
const AdminCreate = React.lazy(() => import('./views/admin/AdminCreate'))
const AdminEdit = React.lazy(() => import('./views/admin/AdminEdit'))

//property

const PropertyList = React.lazy(() => import('./views/property/PropertyList'))
const PropertyCreate = React.lazy(() => import('./views/property/PropertyCreate'))
const PropertyEdit = React.lazy(() => import('./views/property/PropertyEdit'))

//Room Type
const RoomTypeList = React.lazy(() => import('./views/roomTypes/RoomTypeList'))
const RoomTypeCreate = React.lazy(() => import('./views/roomTypes/RoomTypeCreate'))
const RoomTypeEdit = React.lazy(() => import('./views/roomTypes/RoomTypeEdit'))

//season
const SeasonList = React.lazy(() => import('./views/seasons/SeasonList'))
const SeasonCreate = React.lazy(() => import('./views/seasons/SeasonCreate'))
const SeasonEdit = React.lazy(() => import('./views/seasons/SeasonEdit'))

//CANCELLATION POLICY

const CancellationPolicyList = React.lazy(
  () => import('./views/cancellation/CancellationPolicyList'),
)
const CancellationPolicyCreate = React.lazy(
  () => import('./views/cancellation/CancellationPolicyCreate'),
)
const CancellationPolicyEdit = React.lazy(
  () => import('./views/cancellation/CancellationPolicyEdit'),
)
//BOOKING
const BookingList = React.lazy(() => import('./views/bookings/BookingList'))
const CreateBooking = React.lazy(() => import('./views/bookings/CreateBooking'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/theme', name: 'Theme', element: Colors, exact: true },
  { path: '/theme/colors', name: 'Colors', element: Colors },
  { path: '/theme/typography', name: 'Typography', element: Typography },
  { path: '/base', name: 'Base', element: Cards, exact: true },
  { path: '/base/accordion', name: 'Accordion', element: Accordion },
  { path: '/base/breadcrumbs', name: 'Breadcrumbs', element: Breadcrumbs },
  { path: '/base/cards', name: 'Cards', element: Cards },
  { path: '/base/carousels', name: 'Carousel', element: Carousels },
  { path: '/base/collapses', name: 'Collapse', element: Collapses },
  { path: '/base/list-groups', name: 'List Groups', element: ListGroups },
  { path: '/base/navs', name: 'Navs', element: Navs },
  { path: '/base/paginations', name: 'Paginations', element: Paginations },
  { path: '/base/placeholders', name: 'Placeholders', element: Placeholders },
  { path: '/base/popovers', name: 'Popovers', element: Popovers },
  { path: '/base/progress', name: 'Progress', element: Progress },
  { path: '/base/spinners', name: 'Spinners', element: Spinners },
  { path: '/base/tabs', name: 'Tabs', element: Tabs },
  { path: '/base/tables', name: 'Tables', element: Tables },
  { path: '/base/tooltips', name: 'Tooltips', element: Tooltips },
  { path: '/buttons', name: 'Buttons', element: Buttons, exact: true },
  { path: '/buttons/buttons', name: 'Buttons', element: Buttons },
  { path: '/buttons/dropdowns', name: 'Dropdowns', element: Dropdowns },
  { path: '/buttons/button-groups', name: 'Button Groups', element: ButtonGroups },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/forms', name: 'Forms', element: FormControl, exact: true },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl },
  { path: '/forms/select', name: 'Select', element: Select },
  { path: '/forms/checks-radios', name: 'Checks & Radios', element: ChecksRadios },
  { path: '/forms/range', name: 'Range', element: Range },
  { path: '/forms/input-group', name: 'Input Group', element: InputGroup },
  { path: '/forms/floating-labels', name: 'Floating Labels', element: FloatingLabels },
  { path: '/forms/layout', name: 'Layout', element: Layout },
  { path: '/forms/validation', name: 'Validation', element: Validation },
  { path: '/icons', exact: true, name: 'Icons', element: CoreUIIcons },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons },
  { path: '/icons/flags', name: 'Flags', element: Flags },
  { path: '/icons/brands', name: 'Brands', element: Brands },
  { path: '/notifications', name: 'Notifications', element: Alerts, exact: true },
  { path: '/notifications/alerts', name: 'Alerts', element: Alerts },
  { path: '/notifications/badges', name: 'Badges', element: Badges },
  { path: '/notifications/modals', name: 'Modals', element: Modals },
  { path: '/notifications/toasts', name: 'Toasts', element: Toasts },
  { path: '/widgets', name: 'Widgets', element: Widgets },

  // USERS
  { path: '/users', exact: true, name: 'Users', element: UsersList },
  { path: '/users/create', exact: true, name: 'Create User', element: UserCreate },
  { path: '/users/:id', exact: true, name: 'Edit User', element: UserEdit },
  //ROLES
  { path: '/roles', name: 'Roles', element: RoleList },
  { path: '/roles/create', name: 'Create Role', element: RoleCreate },
  { path: '/roles/:id/edit', name: 'Edit Role', element: RoleEdit },
  //ADMIN
  { path: '/admins', name: 'Admin', element: AdminList },
  { path: '/admins/create', name: 'Create Admin', element: AdminCreate },
  { path: '/admins/:id/edit', name: 'Edit Admin', element: AdminEdit },
  //PROPERTY
  { path: '/properties', name: 'properties', element: PropertyList },
  { path: '/properties/create', name: 'Create properties', element: PropertyCreate },
  { path: '/properties/:id/edit', name: 'Edit properties', element: PropertyEdit },
  //ROOM TYPE
  { path: '/room-types', name: 'Room Types', element: RoomTypeList },
  { path: '/room-types/create', name: 'Create Room Types', element: RoomTypeCreate },
  { path: '/room-types/:id/edit', name: 'Edit Room Types', element: RoomTypeEdit },
  //SEASON
  { path: '/seasons', name: 'season', element: SeasonList },
  { path: '/seasons/create', name: 'Create season', element: SeasonCreate },
  { path: '/seasons/:id/edit', name: 'Edit season', element: SeasonEdit },
  //CANCELLATION
  { path: '/cancellation', name: 'Cancellation Policies', element: CancellationPolicyList },

  {
    path: '/cancellation/create',
    name: 'Create Cancellation Policy',
    element: CancellationPolicyCreate,
  },

  {
    path: '/cancellation/:id/edit',
    name: 'Edit Cancellation Policy',
    element: CancellationPolicyEdit,
  },

  { path: '/bookings', name: 'Bookings', element: BookingList },
  { path: '/bookings/create', name: 'Create Booking', element: CreateBooking },
]

export default routes
