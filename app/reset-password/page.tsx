import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset Password"
      subtitle="Request a reset token, then set your new password."
    >
      <ResetPasswordForm />
    </AuthShell>
  )
}
