import Link from "next/link";
import type { ReactNode } from "react";

type AppShellRole = "auth" | "admin" | "teacher" | "parent" | "student";

const navigationByRole: Record<AppShellRole, Array<{ href: string; label: string }>> = {
  auth: [{ href: "/sign-in", label: "Sign in" }],
  admin: [
    { href: "/admin", label: "Admin" },
    { href: "/teacher", label: "Teacher" },
    { href: "/parent", label: "Parent" },
    { href: "/student", label: "Student" }
  ],
  teacher: [{ href: "/teacher", label: "Teacher" }],
  parent: [{ href: "/parent", label: "Parent" }],
  student: [{ href: "/student", label: "Student" }]
};

type AppShellProps = {
  role: AppShellRole;
  title: string;
  children: ReactNode;
};

export function AppShell({ role, title, children }: AppShellProps) {
  const navItems = navigationByRole[role];

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="text-base font-semibold text-slate-950">
            Guidora
          </Link>
          <nav className="flex items-center gap-2" aria-label={`${role} navigation`}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{role}</p>
          <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
          {children}
        </div>
      </section>
    </main>
  );
}
