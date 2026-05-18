import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { AuthSession } from "@guidora/contracts"

export type SessionState = {
  user: AuthSession["user"] | null
  loading: boolean
  error: string | null
}

const initialState: SessionState = {
  user: null,
  loading: false,
  error: null,
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSessionLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setSessionUser(state, action: PayloadAction<AuthSession["user"]>) {
      state.user = action.payload
      state.loading = false
      state.error = null
    },
    setSessionError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
      state.loading = false
    },
    clearSession(state) {
      state.user = null
      state.loading = false
      state.error = null
    },
  },
})

export const {
  clearSession,
  setSessionError,
  setSessionLoading,
  setSessionUser,
} = sessionSlice.actions

export const sessionReducer = sessionSlice.reducer
