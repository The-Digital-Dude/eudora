import { configureStore } from "@reduxjs/toolkit"

import { consoleApi } from "./services/console-api"
import { sessionReducer } from "./slices/session/sessionSlice"
import { uiReducer } from "./slices/ui/uiSlice"
import { usersReducer } from "./slices/users/usersSlice"

export const makeStore = () =>
  configureStore({
    reducer: {
      session: sessionReducer,
      ui: uiReducer,
      users: usersReducer,
      [consoleApi.reducerPath]: consoleApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(consoleApi.middleware),
  })

export const store = makeStore()

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
