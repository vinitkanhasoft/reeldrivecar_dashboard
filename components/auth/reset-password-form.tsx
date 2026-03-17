"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  clearAuthError,
  forgotPassword,
  resetPassword,
} from "@/store/slices/auth-slice"

const requestSchema = z.object({
  email: z.email("Enter a valid email address"),
})

const resetSchema = z.object({
  token: z.string().min(6, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export function ResetPasswordForm() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isLoading } = useAppSelector((state) => state.auth)

  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isResetRequested, setIsResetRequested] = useState(false)

  async function handleRequestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = requestSchema.safeParse({ email })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check your email")
      return
    }

    dispatch(clearAuthError())
    const result = await dispatch(forgotPassword(parsed.data))

    if (forgotPassword.fulfilled.match(result)) {
      toast.success((result.payload as string) || "Reset link sent")
      setIsResetRequested(true)
      return
    }

    toast.error((result.payload as string) || "Unable to send reset link")
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = resetSchema.safeParse({ token, password })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check your details")
      return
    }

    dispatch(clearAuthError())
    const result = await dispatch(resetPassword(parsed.data))

    if (resetPassword.fulfilled.match(result)) {
      toast.success((result.payload as string) || "Password reset successful")
      setToken("")
      setPassword("")
      router.replace("/login")
      return
    }

    toast.error((result.payload as string) || "Unable to reset password")
  }

  return (
    <div className="space-y-8">
      {!isResetRequested ? (
        <form className="space-y-4" onSubmit={handleRequestReset}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Step 1: Request reset link</h2>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="dealer@test.com"
            />
          </div>
          <Button className="w-full" variant="secondary" disabled={isLoading} type="submit">
            {isLoading ? "Sending link..." : "Send reset link"}
          </Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleResetPassword}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Step 2: Set new password</h2>
          <p className="text-xs text-muted-foreground">
            Reset token sent to <span className="font-medium text-foreground">{email}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="token">Reset token</Label>
            <Input
              id="token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste token from email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="newPassword123"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setIsResetRequested(false)}
          >
            Change email
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-600">
        Back to login?{" "}
        <Link href="/login" className="font-semibold text-cyan-700 hover:text-cyan-800">
          Sign in
        </Link>
      </p>
    </div>
  )
}
