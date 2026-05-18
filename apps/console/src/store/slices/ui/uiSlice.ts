import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type ThemeCustomizerTab = "theme" | "layout"

export type UiState = {
  themeCustomizerOpen: boolean
  themeCustomizerTab: ThemeCustomizerTab
}

const initialState: UiState = {
  themeCustomizerOpen: false,
  themeCustomizerTab: "theme",
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openThemeCustomizer(state) {
      state.themeCustomizerOpen = true
    },
    closeThemeCustomizer(state) {
      state.themeCustomizerOpen = false
    },
    setThemeCustomizerOpen(state, action: PayloadAction<boolean>) {
      state.themeCustomizerOpen = action.payload
    },
    setThemeCustomizerTab(state, action: PayloadAction<ThemeCustomizerTab>) {
      state.themeCustomizerTab = action.payload
    },
  },
})

export const {
  closeThemeCustomizer,
  openThemeCustomizer,
  setThemeCustomizerOpen,
  setThemeCustomizerTab,
} = uiSlice.actions

export const uiReducer = uiSlice.reducer
