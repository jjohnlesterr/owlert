import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  /** Tighter mobile padding for cards that sit in a dense 2-up row (e.g.
   * Class Status / Weather on the Home hero row). Desktop padding unchanged. */
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,27,51,0.04)] ${
        compact ? "p-3 sm:p-5" : "p-4 sm:p-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}
