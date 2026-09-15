import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to see your weather and class updates."
    >
      <LoginForm />
    </AuthCard>
  );
}
