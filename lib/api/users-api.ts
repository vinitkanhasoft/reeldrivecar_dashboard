import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { ApiError, refreshAccessTokenApi, shouldRefreshAuth } from "@/lib/api/auth-api"
import type { ApiResponse, AuthTokens, AuthUser } from "@/lib/auth/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000"

type AuthorizedResult<T> = {
  payload: ApiResponse<T>
  tokens: AuthTokens
}

export type UpdateUserPayload = {
  name?: string
  email?: string
  phone?: string
  city?: string
  country?: string
  companyName?: string
  avatar?: File | null
}

export type UserListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

function getTokenValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function normalizeUser(payload: ApiResponse): AuthUser {
  const data = (payload.data ?? {}) as Record<string, unknown>
  const rawUser =
    (data.user as Record<string, unknown> | undefined) ||
    (payload.user as Record<string, unknown> | undefined) ||
    data

  return {
    id: (rawUser.id as string | undefined) || (rawUser._id as string | undefined),
    name: (rawUser.name as string | undefined) || "User",
    email: rawUser.email as string | undefined,
    phone: rawUser.phone as string | undefined,
    role: rawUser.role as string | undefined,
    avatar: rawUser.avatar as string | undefined,
    companyName: rawUser.companyName as string | undefined,
    country: rawUser.country as string | undefined,
    city: rawUser.city as string | undefined,
    isEmailVerified: rawUser.isEmailVerified as boolean | undefined,
    isActive: rawUser.isActive as boolean | undefined,
    isBlocked: rawUser.isBlocked as boolean | undefined,
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") || ""

  if (!contentType.includes("application/json")) {
    if (!response.ok) {
      throw new ApiError("Request failed", response.status)
    }

    return {
      success: true,
      message: "Request completed",
    }
  }

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok) {
    throw new ApiError(payload.message || "Request failed", response.status)
  }

  return payload
}

async function executeAuthorizedRequest<T>(
  path: string,
  options: RequestInit,
  tokens: AuthTokens
): Promise<AuthorizedResult<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  })

  const payload = await parseResponse<T>(response)

  return {
    payload,
    tokens,
  }
}

async function authorizedRequest<T>(
  path: string,
  options: RequestInit,
  tokens: AuthTokens
): Promise<AuthorizedResult<T>> {
  try {
    return await executeAuthorizedRequest<T>(path, options, tokens)
  } catch (error) {
    const refreshToken = getTokenValue(tokens.refreshToken)

    if (!shouldRefreshAuth(error, refreshToken)) {
      throw error
    }

    if (!refreshToken) {
      throw error
    }

    const refreshedTokens = await refreshAccessTokenApi(refreshToken)

    return executeAuthorizedRequest<T>(path, options, refreshedTokens)
  }
}

export async function getProfileDetailsApi(tokens: AuthTokens) {
  const result = await authorizedRequest(API_ENDPOINTS.users.profile, { method: "GET" }, tokens)

  return {
    user: normalizeUser(result.payload),
    tokens: result.tokens,
  }
}

export async function updateUserWithAvatarApi(
  userId: string,
  payload: UpdateUserPayload,
  tokens: AuthTokens
) {
  const formData = new FormData()

  if (payload.name) formData.append("name", payload.name)
  if (payload.email) formData.append("email", payload.email)
  if (payload.phone) formData.append("phone", payload.phone)
  if (payload.city) formData.append("city", payload.city)
  if (payload.country) formData.append("country", payload.country)
  if (payload.companyName) formData.append("companyName", payload.companyName)
  if (payload.avatar) formData.append("avatar", payload.avatar)

  const result = await authorizedRequest(
    API_ENDPOINTS.users.update(userId),
    {
      method: "PATCH",
      body: formData,
    },
    tokens
  )

  return {
    user: normalizeUser(result.payload),
    tokens: result.tokens,
    message: result.payload.message || "Profile updated",
  }
}

export function createUserApi(body: Record<string, unknown>, tokens: AuthTokens) {
  return authorizedRequest(
    API_ENDPOINTS.users.create,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    tokens
  )
}

export function getUsersApi(params: UserListParams, tokens: AuthTokens) {
  const query = new URLSearchParams()

  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  if (params.sortBy) query.set("sortBy", params.sortBy)
  if (params.sortOrder) query.set("sortOrder", params.sortOrder)

  const suffix = query.toString() ? `?${query.toString()}` : ""

  return authorizedRequest(`${API_ENDPOINTS.users.list}${suffix}`, { method: "GET" }, tokens)
}

export function getUserByIdApi(userId: string, tokens: AuthTokens) {
  return authorizedRequest(API_ENDPOINTS.users.byId(userId), { method: "GET" }, tokens)
}

export function deleteUserApi(userId: string, tokens: AuthTokens) {
  return authorizedRequest(API_ENDPOINTS.users.delete(userId), { method: "DELETE" }, tokens)
}
