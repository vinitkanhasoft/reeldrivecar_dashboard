import type { AuthTokens, AuthUser } from "@/lib/auth/types"

const AUTH_STORAGE_KEY = "dashboard_auth"
const ACCESS_COOKIE_KEY = "accessToken"

type StoredAuth = {
  user: AuthUser | null
  tokens: AuthTokens | null
}

function isBrowser() {
  return typeof window !== "undefined"
}

export function readStoredAuth(): StoredAuth {
  if (!isBrowser()) {
    return { user: null, tokens: null }
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return { user: null, tokens: null }
    }

    const parsed = JSON.parse(raw) as StoredAuth
    return {
      user: parsed.user ?? null,
      tokens: parsed.tokens ?? null,
    }
  } catch {
    return { user: null, tokens: null }
  }
}

export function persistAuth(user: AuthUser | null, tokens: AuthTokens | null) {
  if (!isBrowser()) {
    return
  }

  const payload: StoredAuth = { user, tokens }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))

  if (tokens?.accessToken) {
    document.cookie = `${ACCESS_COOKIE_KEY}=${tokens.accessToken}; path=/; max-age=604800; samesite=lax`
  }
}

export function persistTokens(tokens: AuthTokens | null) {
  if (!isBrowser()) {
    return
  }

  const stored = readStoredAuth()
  persistAuth(stored.user, tokens)
}

export function clearStoredAuth() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  document.cookie = `${ACCESS_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`
}
