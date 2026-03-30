export const normalizeRole = (value) => String(value || '').trim().toLowerCase()

export const getUserRole = (user) => normalizeRole(user?.role || user?.Role?.role_name)

export const isSuperAdminUser = (user) => getUserRole(user) === 'super_admin'
