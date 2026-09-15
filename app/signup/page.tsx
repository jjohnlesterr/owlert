import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/app/signup/signup-form";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Track weather and class updates from trusted sources."
    >
      <SignupForm />
    </AuthCard>
  );
}
