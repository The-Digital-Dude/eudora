import { AppShell } from "@/components/app-shell/AppShell";

export default function ParentPage() {
  return (
    <AppShell role="parent" title="Parent Portal">
      <p className="text-sm text-slate-600">Family schedules, invoices, messages, and student progress begin here.</p>
    </AppShell>
  );
}
