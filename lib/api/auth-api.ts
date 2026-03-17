import type {
  ApiResponse,
  AuthTokens,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
} from "@/lib/auth/types"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { persistTokens } from "@/lib/auth/storage"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function isJwtExpiredMessage(message: string) {
  const normalizedMessage = message.toLowerCase()
  return normalizedMessage.includes("jwt expired") || normalizedMessage.includes("tokenexpirederror")
}

export function shouldRefreshAuth(error: unknown, refreshToken?: string) {
  if (!refreshToken) {
    return false
  }

  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403 || isJwtExpiredMessage(error.message)
  }

  if (error instanceof Error) {
    return isJwtExpiredMessage(error.message)
  }

  return false
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    if (!response.ok) {
      throw new ApiError("Request failed", response.status)
    }

    return {
      success: response.ok,
      message: response.ok ? "Request completed" : "Request failed",
      data: undefined,
    }
  }

  const payload = (await response.json()) as ApiResponse<T>
  if (!response.ok) {
    throw new ApiError(payload.message || "Request failed", response.status)
  }

  return payload
}

async function request<T>(path: string, body: unknown) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  return parseResponse<T>(response)
}

function extractTokens(payload: ApiResponse, fallbackRefreshToken?: string): AuthTokens {
  const data = (payload.data ?? {}) as Record<string, unknown>
  const nestedTokens = (data.tokens ?? {}) as Record<string, unknown>
  const topTokens = payload as unknown as Record<string, unknown>

  const accessToken =
    (nestedTokens.accessToken as string | undefined) ||
    (data.accessToken as string | undefined) ||
    (topTokens.accessToken as string | undefined)

  const refreshToken =
    (nestedTokens.refreshToken as string | undefined) ||
    (data.refreshToken as string | undefined) ||
    (topTokens.refreshToken as string | undefined) ||
    fallbackRefreshToken

  if (!accessToken) {
    throw new Error(payload.message || "Access token not found in response")
  }

  return {
    accessToken,
    refreshToken,
  }
}

function extractUser(payload: ApiResponse): AuthUser {
  const data = (payload.data ?? {}) as Record<string, unknown>
  const rawUser =
    (data.user as Record<string, unknown> | undefined) ||
    (payload.user as Record<string, unknown> | undefined) ||
    (data as Record<string, unknown>)

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

export function loginApi(body: LoginRequest) {
  return request(API_ENDPOINTS.auth.login, body)
}

export function forgotPasswordApi(body: ForgotPasswordRequest) {
  return request(API_ENDPOINTS.auth.forgotPassword, body)
}

export function resetPasswordApi(body: ResetPasswordRequest) {
  return request(API_ENDPOINTS.auth.resetPassword, body)
}

export async function refreshAccessTokenApi(refreshToken: string) {
  const response = await request(API_ENDPOINTS.auth.refresh, { refreshToken })
  const refreshedTokens = extractTokens(response, refreshToken)
  persistTokens(refreshedTokens)
  return refreshedTokens
}

async function getProfileWithAccessToken(accessToken: string) {
  const response = await fetch(`${BASE_URL}${API_ENDPOINTS.users.profile}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return parseResponse(response)
}

export async function getProfileApi(tokens: AuthTokens) {
  try {
    const profileResponse = await getProfileWithAccessToken(tokens.accessToken)
    return {
      user: extractUser(profileResponse),
      tokens,
    }
  } catch (error) {
    if (!shouldRefreshAuth(error, tokens.refreshToken)) {
      throw error
    }

    const refreshToken = tokens.refreshToken
    if (!refreshToken) {
      throw error
    }

    const refreshedTokens = await refreshAccessTokenApi(refreshToken)
    const profileResponse = await getProfileWithAccessToken(refreshedTokens.accessToken)

    return {
      user: extractUser(profileResponse),
      tokens: refreshedTokens,
    }
  }
}

export function logoutApi(accessToken?: string) {
  return fetch(`${BASE_URL}${API_ENDPOINTS.auth.logout}`, {
    method: "POST",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  }).catch(() => null)
}
