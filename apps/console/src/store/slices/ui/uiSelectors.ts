import type { RootState } from "@/store/store"

export const selectIsThemeCustomizerOpen = (state: RootState) =>
  state.ui.themeCustomizerOpen

export const selectThemeCustomizerTab = (state: RootState) =>
  state.ui.themeCustomizerTab
