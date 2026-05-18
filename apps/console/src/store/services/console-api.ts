import {
  type ApiResponse,
  type AuthSession,
  type CreateUserRequest,
  type LoginRequest,
  type ResetPasswordResponse,
  type UpdateUserRequest,
  type UserListResponse,
} from "@guidora/contracts"
import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react"

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

type ConsoleBaseQueryArgs = {
  url: string
  method?: string
  body?: unknown
  headers?: HeadersInit
}

export type ConsoleApiErrorData = {
  code: string
  message: string
  details?: Record<string, unknown>
}

export const consoleBaseQuery: BaseQueryFn<
  ConsoleBaseQueryArgs,
  unknown,
  { status: number | "FETCH_ERROR" | "PARSING_ERROR"; data: ConsoleApiErrorData }
> = async ({ url, method = "GET", body, headers }) => {
  try {
    const response = await fetch(`${apiBaseUrl}${url}`, {
      method,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: body == null ? undefined : JSON.stringify(body),
    })

    const payload = (await response.json()) as ApiResponse<unknown>

    if (!payload.success) {
      return {
        error: {
          status: response.status,
          data: payload.error,
        },
      }
    }

    return { data: payload.data }
  } catch (error) {
    return {
      error: {
        status: "FETCH_ERROR",
        data: {
          code: "FETCH_ERROR",
          message: error instanceof Error ? error.message : "Unable to reach API",
        },
      },
    }
  }
}

export const consoleApi = createApi({
  reducerPath: "consoleApi",
  baseQuery: consoleBaseQuery,
  tagTypes: ["Session", "Users"],
  endpoints: (builder) => ({
    me: builder.query<AuthSession, void>({
      query: () => ({ url: "/auth/me" }),
      providesTags: ["Session"],
    }),
    login: builder.mutation<AuthSession, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    logout: builder.mutation<{ ok: true }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Session"],
    }),
    listUsers: builder.query<UserListResponse, void>({
      query: () => ({ url: "/users" }),
      providesTags: ["Users"],
    }),
    createUser: builder.mutation<AuthSession["user"], CreateUserRequest>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation<
      AuthSession["user"],
      { id: string; input: UpdateUserRequest }
    >({
      query: ({ id, input }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: input,
      }),
      invalidatesTags: ["Users", "Session"],
    }),
    disableUser: builder.mutation<AuthSession["user"], string>({
      query: (id) => ({ url: `/users/${id}/disable`, method: "POST" }),
      invalidatesTags: ["Users"],
    }),
    resetPassword: builder.mutation<ResetPasswordResponse, string>({
      query: (id) => ({ url: `/users/${id}/reset-password`, method: "POST" }),
    }),
  }),
})

export const {
  useCreateUserMutation,
  useDisableUserMutation,
  useListUsersQuery,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useResetPasswordMutation,
  useUpdateUserMutation,
} = consoleApi
