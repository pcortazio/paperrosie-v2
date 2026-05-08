import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <div className="mb-6">
        <div className="mb-4 flex size-9 items-center justify-center rounded-md bg-accent/10 text-sm font-medium text-accent">
          PR
        </div>
        <h1 className="text-2xl font-medium text-foreground">Sign in</h1>
      </div>
      <LoginForm />
    </Card>
  );
}
