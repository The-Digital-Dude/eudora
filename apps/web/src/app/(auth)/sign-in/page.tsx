import { AppShell } from "@/components/app-shell/AppShell";
import { Button } from "@guidora/ui";

export default function SignInPage() {
  return (
    <AppShell role="auth" title="Sign In">
      <p className="text-sm text-slate-600">Managed authentication will attach here in E0.F3.</p>
      <div className="pt-4">
        <Button type="button">Continue</Button>
      </div>
    </AppShell>
  );
}
