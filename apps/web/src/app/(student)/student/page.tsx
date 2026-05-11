import { AppShell } from "@/components/app-shell/AppShell";

export default function StudentPage() {
  return (
    <AppShell role="student" title="Student Portal">
      <p className="text-sm text-slate-600">Assignments, homework, attempts, and learning feedback begin here.</p>
    </AppShell>
  );
}
