import { AppShell } from "@/components/app-shell/AppShell";

export default function TeacherPage() {
  return (
    <AppShell role="teacher" title="Teacher Workspace">
      <p className="text-sm text-slate-600">Daily classes, attendance, make-ups, and learning tasks begin here.</p>
    </AppShell>
  );
}
