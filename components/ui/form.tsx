import type { ReactNode } from "react";

export const inputClass =
  "block w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-5 text-navy placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";

export const selectClass = inputClass;

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
