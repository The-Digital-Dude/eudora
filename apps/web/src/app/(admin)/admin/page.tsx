import { AppShell } from "@/components/app-shell/AppShell";

export default function AdminPage() {
  return (
    <AppShell role="admin" title="Admin Workspace">
      <p className="text-sm text-slate-600">Owner, billing, academic, and centre operations begin here.</p>
    </AppShell>
  );
}
