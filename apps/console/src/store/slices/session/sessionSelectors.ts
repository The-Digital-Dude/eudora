import type { RootState } from "@/store/store"
import { PERMISSIONS } from "@guidora/contracts"

export const selectCurrentUser = (state: RootState) => state.session.user
export const selectSessionLoading = (state: RootState) => state.session.loading
export const selectSessionError = (state: RootState) => state.session.error
export const selectCurrentPermissions = (state: RootState) =>
  state.session.user?.permissions ?? []
export const selectIsOwner = (state: RootState) =>
  state.session.user?.role.key === "OWNER"

export const selectCanReadUsers = (state: RootState) =>
  selectCurrentPermissions(state).includes(PERMISSIONS.USERS_READ)

export const selectCanCreateUsers = (state: RootState) =>
  selectCurrentPermissions(state).includes(PERMISSIONS.USERS_CREATE)

export const selectCanUpdateUsers = (state: RootState) =>
  selectCurrentPermissions(state).includes(PERMISSIONS.USERS_UPDATE)

export const selectCanDisableUsers = (state: RootState) =>
  selectCurrentPermissions(state).includes(PERMISSIONS.USERS_DISABLE)

export const selectCanResetPasswords = (state: RootState) =>
  selectCurrentPermissions(state).includes(PERMISSIONS.USERS_RESET_PASSWORD)

export const selectCanManageOwnerUsers = (state: RootState) =>
  selectCurrentPermissions(state).includes(PERMISSIONS.USERS_MANAGE_OWNER)
