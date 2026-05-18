import type { RootState } from "@/store/store"

export const selectActiveUserDialog = (state: RootState) => state.users.activeDialog
export const selectSelectedUserId = (state: RootState) => state.users.selectedUserId
export const selectTemporaryPassword = (state: RootState) => state.users.temporaryPassword
