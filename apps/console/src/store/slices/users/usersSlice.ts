import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type UserDialog = "create" | "edit" | null

export type UsersState = {
  activeDialog: UserDialog
  selectedUserId: string | null
  temporaryPassword: string | null
}

const initialState: UsersState = {
  activeDialog: null,
  selectedUserId: null,
  temporaryPassword: null,
}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    openCreateUserDialog(state) {
      state.activeDialog = "create"
      state.selectedUserId = null
    },
    openEditUserDialog(state, action: PayloadAction<string>) {
      state.activeDialog = "edit"
      state.selectedUserId = action.payload
    },
    closeUserDialog(state) {
      state.activeDialog = null
      state.selectedUserId = null
    },
    showTemporaryPassword(state, action: PayloadAction<string>) {
      state.temporaryPassword = action.payload
    },
    clearTemporaryPassword(state) {
      state.temporaryPassword = null
    },
  },
})

export const {
  clearTemporaryPassword,
  closeUserDialog,
  openCreateUserDialog,
  openEditUserDialog,
  showTemporaryPassword,
} = usersSlice.actions

export const usersReducer = usersSlice.reducer
