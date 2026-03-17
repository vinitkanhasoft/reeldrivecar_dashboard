import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { ApiError, refreshAccessTokenApi, shouldRefreshAuth } from "@/lib/api/auth-api"
import type { ApiResponse, AuthTokens } from "@/lib/auth/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000"

type AuthorizedResult<T> = {
  payload: ApiResponse<T>
  tokens: AuthTokens
}

export type Banner = {
  id: string
  title: string
  description?: string
  image?: string
  imagePublicId?: string
  altText?: string
  type?: string
  keywords?: string
  isActive?: boolean
  startDate?: string
  endDate?: string
  createdAt?: string
  updatedAt?: string
}

export type BannerFormPayload = {
  title: string
  description: string
  altText: string
  type: string
  keywords: string
  isActive: boolean
  startDate: string
  endDate: string
  image?: File | null
}

type BannerPaginationMeta = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

function normalizeBanner(input: Record<string, unknown>): Banner {
  return {
    id: (input.id as string | undefined) || (input._id as string | undefined) || "",
    title: (input.title as string | undefined) || "Untitled banner",
    description: input.description as string | undefined,
    image:
      (input.image as string | undefined) ||
      (input.imageUrl as string | undefined),
    imagePublicId: input.imagePublicId as string | undefined,
    altText: input.altText as string | undefined,
    type: input.type as string | undefined,
    keywords: input.keywords as string | undefined,
    isActive: input.isActive as boolean | undefined,
    startDate: input.startDate as string | undefined,
    endDate: input.endDate as string | undefined,
    createdAt: input.createdAt as string | undefined,
    updatedAt: input.updatedAt as string | undefined,
  }
}

function extractBannerArray(payload: ApiResponse): Banner[] {
  const data = (payload.data ?? payload) as Record<string, unknown>

  const source =
    (Array.isArray(data.banners) ? data.banners : undefined) ||
    (Array.isArray(data.items) ? data.items : undefined) ||
    (Array.isArray(payload.data) ? payload.data : undefined) ||
    (Array.isArray((data.results as unknown[] | undefined)) ? (data.results as unknown[]) : undefined) ||
    []

  return source
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map(normalizeBanner)
}

function extractSingleBanner(payload: ApiResponse): Banner {
  const data = (payload.data ?? {}) as Record<string, unknown>
  const source =
    (data.banner as Record<string, unknown> | undefined) ||
    (payload.banner as Record<string, unknown> | undefined) ||
    data

  return normalizeBanner(source)
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

function extractBannerPagination(
  payload: ApiResponse,
  fallbackCount: number,
  fallbackPage: number,
  fallbackLimit: number
): BannerPaginationMeta {
  const root = payload as Record<string, unknown>
  const payloadData = payload.data
  const data =
    payloadData && typeof payloadData === "object" && !Array.isArray(payloadData)
      ? (payloadData as Record<string, unknown>)
      : {}
  const meta = (data.meta as Record<string, unknown> | undefined) ?? {}
  const pagination =
    (data.pagination as Record<string, unknown> | undefined) ??
    (root.pagination as Record<string, unknown> | undefined) ??
    {}

  const page =
    toNumber(data.page) ??
    toNumber(data.currentPage) ??
    toNumber(root.page) ??
    toNumber(meta.page) ??
    toNumber(meta.currentPage) ??
    toNumber(pagination.page) ??
    fallbackPage

  const limit =
    toNumber(data.limit) ??
    toNumber(data.perPage) ??
    toNumber(root.limit) ??
    toNumber(meta.limit) ??
    toNumber(meta.perPage) ??
    toNumber(pagination.limit) ??
    toNumber(pagination.perPage) ??
    fallbackLimit

  const totalItems =
    toNumber(data.totalItems) ??
    toNumber(data.total) ??
    toNumber(data.count) ??
    toNumber(data.itemCount) ??
    toNumber(root.totalItems) ??
    toNumber(root.total) ??
    toNumber(meta.totalItems) ??
    toNumber(meta.total) ??
    toNumber(meta.count) ??
    toNumber(meta.itemCount) ??
    toNumber(pagination.totalItems) ??
    toNumber(pagination.total) ??
    fallbackCount

  const totalPages =
    toNumber(data.totalPages) ??
    toNumber(data.pages) ??
    toNumber(root.totalPages) ??
    toNumber(meta.totalPages) ??
    toNumber(meta.pages) ??
    toNumber(pagination.totalPages) ??
    toNumber(pagination.pages) ??
    Math.max(1, Math.ceil(totalItems / Math.max(limit, 1)))

  return {
    page: Math.max(1, Math.trunc(page)),
    limit: Math.max(1, Math.trunc(limit)),
    totalItems: Math.max(0, Math.trunc(totalItems)),
    totalPages: Math.max(1, Math.trunc(totalPages)),
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
    const refreshToken = tokens.refreshToken

    if (!shouldRefreshAuth(error, refreshToken) || !refreshToken) {
      throw error
    }

    const refreshedTokens = await refreshAccessTokenApi(refreshToken)
    return executeAuthorizedRequest<T>(path, options, refreshedTokens)
  }
}

export async function getBannersApi(
  params: { page?: number; limit?: number; search?: string },
  tokens: AuthTokens
) {
  const query = new URLSearchParams()

  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  if (typeof params.search === "string") query.set("search", params.search)

  const suffix = query.toString() ? `?${query.toString()}` : ""
  const result = await authorizedRequest(`${API_ENDPOINTS.banners.base}${suffix}`, { method: "GET" }, tokens)

  const banners = extractBannerArray(result.payload)
  const pagination = extractBannerPagination(
    result.payload,
    banners.length,
    params.page ?? 1,
    (params.limit ?? banners.length) || 1
  )

  return {
    banners,
    page: pagination.page,
    limit: pagination.limit,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
    tokens: result.tokens,
  }
}

export async function createBannerApi(payload: BannerFormPayload, tokens: AuthTokens) {
  const formData = new FormData()
  formData.append("title", payload.title)
  formData.append("description", payload.description)
  formData.append("altText", payload.altText)
  formData.append("type", payload.type)
  formData.append("keywords", payload.keywords)
  formData.append("isActive", String(payload.isActive))
  formData.append("startDate", payload.startDate)
  formData.append("endDate", payload.endDate)
  if (payload.image) formData.append("image", payload.image)

  const result = await authorizedRequest(
    API_ENDPOINTS.banners.base,
    {
      method: "POST",
      body: formData,
    },
    tokens
  )

  return {
    banner: extractSingleBanner(result.payload),
    message: result.payload.message || "Banner created",
    tokens: result.tokens,
  }
}

export async function updateBannerApi(
  bannerId: string,
  payload: Partial<BannerFormPayload>,
  tokens: AuthTokens
) {
  const formData = new FormData()

  if (payload.title !== undefined) formData.append("title", payload.title)
  if (payload.description !== undefined) formData.append("description", payload.description)
  if (payload.altText !== undefined) formData.append("altText", payload.altText)
  if (payload.type !== undefined) formData.append("type", payload.type)
  if (payload.keywords !== undefined) formData.append("keywords", payload.keywords)
  if (payload.isActive !== undefined) formData.append("isActive", String(payload.isActive))
  if (payload.startDate !== undefined) formData.append("startDate", payload.startDate)
  if (payload.endDate !== undefined) formData.append("endDate", payload.endDate)
  if (payload.image) formData.append("image", payload.image)

  const result = await authorizedRequest(
    API_ENDPOINTS.banners.byId(bannerId),
    {
      method: "PATCH",
      body: formData,
    },
    tokens
  )

  return {
    banner: extractSingleBanner(result.payload),
    message: result.payload.message || "Banner updated",
    tokens: result.tokens,
  }
}

export async function deleteBannerApi(bannerId: string, tokens: AuthTokens) {
  const result = await authorizedRequest(
    API_ENDPOINTS.banners.byId(bannerId),
    { method: "DELETE" },
    tokens
  )

  return {
    message: result.payload.message || "Banner deleted",
    tokens: result.tokens,
  }
}
