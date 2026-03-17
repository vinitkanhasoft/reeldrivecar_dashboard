"use client"

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import {
  ApiError,
  forgotPasswordApi,
  getProfileApi,
  loginApi,
  logoutApi,
  resetPasswordApi,
} from "@/lib/api/auth-api"
import { clearStoredAuth, persistAuth, readStoredAuth } from "@/lib/auth/storage"
import type {
  ApiResponse,
  AuthState,
  AuthTokens,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
} from "@/lib/auth/types"

type LoginPayload = {
  user: AuthUser
  tokens: AuthTokens
  message?: string
}

type ProfilePayload = {
  user: AuthUser
  tokens: AuthTokens
}

type CheckProfileError = {
  message: string
  unauthorized: boolean
}

function extractAuthFromResponse(payload: ApiResponse): LoginPayload {
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
    (topTokens.refreshToken as string | undefined)

  if (!accessToken) {
    throw new Error(payload.message || "Access token not found in response")
  }

  const rawUser =
    (data.user as Record<string, unknown> | undefined) ||
    (payload.user as Record<string, unknown> | undefined) ||
    {}

  return {
    user: {
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
    },
    tokens: {
      accessToken,
      refreshToken,
    },
    message: payload.message,
  }
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  hydrated: false,
}

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await loginApi(credentials)
      return extractAuthFromResponse(response)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed"
      return rejectWithValue(message)
    }
  }
)

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await forgotPasswordApi(payload)
      return response.message || "Password reset link sent"
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset link"
      return rejectWithValue(message)
    }
  }
)

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await resetPasswordApi(payload)
      return response.message || "Password reset successful"
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password"
      return rejectWithValue(message)
    }
  }
)

export const checkProfile = createAsyncThunk<
  ProfilePayload,
  void,
  { rejectValue: CheckProfileError; state: { auth: AuthState } }
>("auth/checkProfile", async (_, { getState, rejectWithValue }) => {
  const currentTokens = getState().auth.tokens

  if (!currentTokens?.accessToken) {
    return rejectWithValue({
      message: "No active session",
      unauthorized: true,
    })
  }

  try {
    const result = await getProfileApi(currentTokens)
    return {
      user: result.user,
      tokens: result.tokens,
    }
  } catch (error) {
    const unauthorized = error instanceof ApiError && (error.status === 401 || error.status === 403)
    const message = error instanceof Error ? error.message : "Unable to verify profile"

    return rejectWithValue({ message, unauthorized })
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth(state) {
      const stored = readStoredAuth()
      state.user = stored.user
      state.tokens = stored.tokens
      state.isAuthenticated = Boolean(stored.tokens?.accessToken)
      state.hydrated = true
    },
    logout(state) {
      const accessToken = state.tokens?.accessToken
      void logoutApi(accessToken)

      state.user = null
      state.tokens = null
      state.isAuthenticated = false
      state.error = null
      clearStoredAuth()
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.tokens = action.payload.tokens
        state.isAuthenticated = true
        persistAuth(action.payload.user, action.payload.tokens)
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Login failed"
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Unable to send reset link"
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Unable to reset password"
      })
      .addCase(checkProfile.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.tokens = action.payload.tokens
        state.isAuthenticated = true
        state.error = null
        persistAuth(action.payload.user, action.payload.tokens)
      })
      .addCase(checkProfile.rejected, (state, action) => {
        const payload = action.payload as CheckProfileError | undefined

        if (payload?.unauthorized) {
          state.user = null
          state.tokens = null
          state.isAuthenticated = false
          state.error = payload.message
          clearStoredAuth()
          return
        }

        if (payload?.message) {
          state.error = payload.message
        }
      })
  },
})

export const { hydrateAuth, logout, clearAuthError } = authSlice.actions
export default authSlice.reducer
