import type { ButtonHTMLAttributes, ReactNode } from "react";

const baseButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-900 bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50";

export function buttonClassName(className?: string): string {
  return className
    ? `${baseButtonClassName} ${className}`
    : baseButtonClassName;
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function Button({ className, children, ...props }: ButtonProps) {
  return (
    <button className={buttonClassName(className)} {...props}>
      {children}
    </button>
  );
}
