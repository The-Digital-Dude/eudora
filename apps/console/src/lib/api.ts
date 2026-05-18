import {
  ApiResponse,
  AuthSession,
  CreateUserRequest,
  LoginRequest,
  ResetPasswordResponse,
  UpdateUserRequest,
  UserListResponse
} from "@guidora/contracts";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ConsoleApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...init.headers
    }
  });
  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ConsoleApiError(body.error.message, body.error.code, response.status);
  }

  return body.data;
}

export const consoleApi = {
  login(input: LoginRequest): Promise<AuthSession> {
    return apiFetch<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  logout(): Promise<{ ok: true }> {
    return apiFetch<{ ok: true }>("/auth/logout", { method: "POST" });
  },

  me(): Promise<AuthSession> {
    return apiFetch<AuthSession>("/auth/me");
  },

  listUsers(): Promise<UserListResponse> {
    return apiFetch<UserListResponse>("/users");
  },

  createUser(input: CreateUserRequest): Promise<AuthSession["user"]> {
    return apiFetch<AuthSession["user"]>("/users", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  updateUser(id: string, input: UpdateUserRequest): Promise<AuthSession["user"]> {
    return apiFetch<AuthSession["user"]>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },

  disableUser(id: string): Promise<AuthSession["user"]> {
    return apiFetch<AuthSession["user"]>(`/users/${id}/disable`, { method: "POST" });
  },

  resetPassword(id: string): Promise<ResetPasswordResponse> {
    return apiFetch<ResetPasswordResponse>(`/users/${id}/reset-password`, { method: "POST" });
  }
};
