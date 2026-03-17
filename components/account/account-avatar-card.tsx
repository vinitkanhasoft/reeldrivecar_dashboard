"use client"

import { CameraIcon, Loader2Icon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AuthUser } from "@/lib/auth/types"

function getInitials(name?: string) {
  const safeName = (name || "User").trim()
  const chunks = safeName.split(" ").filter(Boolean)

  if (chunks.length === 0) {
    return "U"
  }

  const first = chunks[0]?.[0] ?? ""
  const second = chunks[1]?.[0] ?? ""

  return `${first}${second}`.toUpperCase() || "U"
}

type AccountAvatarCardProps = {
  user: AuthUser
  onAvatarChange: (file: File | null) => void
  selectedAvatarName?: string
  isAvatarUploading?: boolean
}

export function AccountAvatarCard({
  user,
  onAvatarChange,
  selectedAvatarName,
  isAvatarUploading = false,
}: AccountAvatarCardProps) {
  return (
    <Card className="w-full overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="space-y-1 border-b bg-muted/20 px-6 py-4">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Account Profile
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Manage your avatar and profile status
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative flex justify-center sm:justify-start">
            <div className="relative">
              <Avatar className="size-24 rounded-[22px] transition-all duration-200 hover:scale-[1.02] sm:size-28">
                <AvatarImage
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-[22px] text-2xl font-semibold text-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <label
                htmlFor="account-avatar-upload"
                className="absolute right-1 bottom-1 flex cursor-pointer items-center justify-center rounded-full border border-border bg-background p-2 text-foreground shadow-lg transition-all duration-200 hover:bg-muted hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring/40 sm:p-2.5 disabled:pointer-events-none disabled:opacity-70"
                title={isAvatarUploading ? "Uploading avatar..." : "Upload avatar"}
                aria-disabled={isAvatarUploading}
              >
                {isAvatarUploading ? (
                  <Loader2Icon className="size-4 animate-spin sm:size-5" />
                ) : (
                  <CameraIcon className="size-4 sm:size-5" />
                )}
                <input
                  id="account-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isAvatarUploading}
                  onChange={(event) => {
                    onAvatarChange(event.target.files?.[0] || null)
                    event.currentTarget.value = ""
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                {user.name || "User"}
              </h3>
              <p className="text-sm text-muted-foreground break-all sm:text-base">
                {user.email || "No email"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={user.isActive
                  ? "border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                  : "px-3 py-1 text-xs font-medium"
                }
              >
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant="outline"
                className={user.isEmailVerified
                  ? "border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                  : "px-3 py-1 text-xs font-medium"
                }
              >
                {user.isEmailVerified ? "Email Verified" : "Email Not Verified"}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
                {user.role || "No Role"}
              </Badge>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Dealer
                </p>
                <p className="font-medium truncate">
                  {user.companyName || "Not set"}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </p>
                <p className="font-medium truncate">
                  {user.phone || "Not set"}
                </p>
              </div>
              
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </p>
                <p className="font-medium truncate">
                  {[user.city, user.country].filter(Boolean).join(", ") || "Not set"}
                </p>
              </div>

              {selectedAvatarName && (
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Selected Image
                  </p>
                  <p className="text-sm text-foreground truncate">
                    {selectedAvatarName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}