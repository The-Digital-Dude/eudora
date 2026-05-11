import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const baseClass =
    "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variantClass =
    variant === "primary"
      ? "bg-slate-950 text-white hover:bg-slate-800 focus-visible:outline-slate-950"
      : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-slate-500";

  return <button className={[baseClass, variantClass, className].filter(Boolean).join(" ")} {...props} />;
}
