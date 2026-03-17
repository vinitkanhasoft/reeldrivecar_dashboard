"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Building2Icon, Loader2Icon, ShieldCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { AccountAvatarCard } from "@/components/account/account-avatar-card"
import { AccountTabs } from "@/components/account/account-tabs"
import { updateUserWithAvatarApi } from "@/lib/api/users-api"
import type { AuthUser } from "@/lib/auth/types"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { checkProfile } from "@/store/slices/auth-slice"
import { Badge } from "@/components/ui/badge"

type AccountFormState = {
  name: string
  email: string
  phone: string
  companyName: string
  country: string
  city: string
}

function buildFormState(user: AuthUser | null): AccountFormState {
  return {
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    companyName: user?.companyName || "",
    country: user?.country || "",
    city: user?.city || "",
  }
}

export function AccountPageClient() {
  const dispatch = useAppDispatch()
  const { user, tokens } = useAppSelector((state) => state.auth)

  const [form, setForm] = useState<AccountFormState>(() => buildFormState(user))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const hasLoadedProfileRef = useRef(false)

  const userId = useMemo(() => user?.id, [user?.id])

  useEffect(() => {
    setForm(buildFormState(user))
  }, [user])

  useEffect(() => {
    if (!tokens?.accessToken || hasLoadedProfileRef.current) {
      return
    }

    hasLoadedProfileRef.current = true
    void dispatch(checkProfile())
  }, [dispatch, tokens?.accessToken])

  function onFieldChange(field: keyof AccountFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAvatarChange(file: File | null) {
    setAvatarFile(file)

    if (!file) {
      return
    }

    if (!tokens?.accessToken) {
      toast.error("Please login again")
      return
    }

    if (!userId) {
      toast.error("User id not found")
      return
    }

    if (isSaving || isAvatarUploading) {
      toast.error("Please wait for current update to finish")
      return
    }

    try {
      setIsAvatarUploading(true)

      const result = await updateUserWithAvatarApi(
        userId,
        {
          avatar: file,
        },
        tokens
      )

      toast.success(result.message || "Avatar updated")
      setAvatarFile(null)
      await dispatch(checkProfile())
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update avatar"
      toast.error(message)
    } finally {
      setIsAvatarUploading(false)
    }
  }

  async function handleSave() {
    if (!tokens?.accessToken) {
      toast.error("Please login again")
      return
    }

    if (!userId) {
      toast.error("User id not found")
      return
    }

    try {
      setIsSaving(true)
      const result = await updateUserWithAvatarApi(
        userId,
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          companyName: form.companyName,
          city: form.city,
          country: form.country,
          avatar: avatarFile,
        },
        tokens
      )

      toast.success(result.message || "Profile updated")
      setAvatarFile(null)
      await dispatch(checkProfile())
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 lg:p-6">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheckIcon className="size-4" />
              Account center
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Manage your account
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Update your personal details, dealership information, and contact data from one place.
              </p>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2">
            <Badge variant="outline" className="h-8 rounded-full px-3 text-xs font-medium">
              <Building2Icon className="mr-1 size-3.5" />
              {user?.companyName || "Dealer profile"}
            </Badge>
            <Badge
              variant="outline"
              className={user?.isActive
                ? "h-8 rounded-full border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700"
                : "h-8 rounded-full px-3 text-xs font-medium"
              }
            >
              {user?.isActive ? "Active account" : "Inactive account"}
            </Badge>
          </div>
        </div>
      </section>

      <AccountAvatarCard
        user={user || {}}
        onAvatarChange={handleAvatarChange}
        selectedAvatarName={avatarFile?.name}
        isAvatarUploading={isAvatarUploading}
      />
      <AccountTabs
        form={form}
        isSaving={isSaving}
        onFieldChange={onFieldChange}
        onSave={handleSave}
      />
    </div>
  )
}
