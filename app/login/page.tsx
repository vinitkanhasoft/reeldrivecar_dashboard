import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Login with your dealer account to access the dashboard."
    >
      <LoginForm />
    </AuthShell>
  )
}
