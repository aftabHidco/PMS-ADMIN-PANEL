export const EMPTY_MASTER_ROOM_TYPE_FORM = {
  room_type_code: '',
  room_type_name: '',
  base_occupancy: '',
  max_occupancy: '',
  description: '',
  is_active: true,
}

export const readJsonSafely = async (response) => {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (error) {
    return null
  }
}

export const getListData = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export const getErrorMessage = (payload, fallback) =>
  payload?.message || payload?.error || fallback

export const toBooleanFlag = (value) =>
  value === true || value === 1 || value === '1' || value === 'true'

export const getMasterRoomTypeId = (item) =>
  Number(item?.room_type_master_id ?? item?.master_room_type_id ?? item?.id ?? 0)

export const getPropertyRoomTypeId = (item) => Number(item?.room_type_id ?? item?.id ?? 0)

export const findMasterRoomTypeById = (items = [], value) => {
  const targetId = Number(value)

  if (!targetId) return null

  return items.find((item) => getMasterRoomTypeId(item) === targetId) || null
}

export const toMasterRoomTypeFormValues = (item = {}) => ({
  room_type_code: String(item?.room_type_code || ''),
  room_type_name: String(item?.room_type_name || ''),
  base_occupancy: item?.base_occupancy ?? '',
  max_occupancy: item?.max_occupancy ?? '',
  description: String(item?.description || ''),
  is_active: item?.is_active === undefined ? true : toBooleanFlag(item.is_active),
})

export const buildMasterRoomTypePayload = (formValues) => ({
  room_type_code: String(formValues.room_type_code || '').trim(),
  room_type_name: String(formValues.room_type_name || '').trim(),
  base_occupancy: Number(formValues.base_occupancy),
  max_occupancy: Number(formValues.max_occupancy),
  description: String(formValues.description || '').trim(),
  is_active: !!formValues.is_active,
})
