export type AuthUser = {
  id?: string
  name?: string
  email?: string
  phone?: string
  role?: string
  avatar?: string
  companyName?: string
  country?: string
  city?: string
  isEmailVerified?: boolean
  isActive?: boolean
  isBlocked?: boolean
}

export type AuthTokens = {
  accessToken: string
  refreshToken?: string
}

export type AuthState = {
  user: AuthUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  hydrated: boolean
}

export type LoginRequest = {
  email: string
  password: string
}

export type ForgotPasswordRequest = {
  email: string
}

export type ResetPasswordRequest = {
  token: string
  password: string
}

export type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
  [key: string]: unknown
}
