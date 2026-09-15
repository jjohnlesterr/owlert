import type { ReactNode } from "react";

export type BadgeTone =
  | "safe"
  | "warning"
  | "critical"
  | "info"
  | "official"
  | "news"
  | "custom"
  | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  safe: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  critical: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  official: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  news: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
  custom: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
