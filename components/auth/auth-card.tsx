import Image from "next/image";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-background px-4 py-10 sm:py-12">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,27,51,0.04)] md:grid md:grid-cols-2">
        <div className="relative flex flex-col items-center justify-center gap-3 overflow-hidden bg-navy px-6 py-8 text-center sm:py-10 md:gap-4 md:px-10 md:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-[var(--color-bee-yellow)]/10 blur-3xl"
          />
          <Image
            src="/mascot/beealert-banner.png"
            alt="BeeAlert mascot"
            width={220}
            height={207}
            className="relative h-24 w-auto sm:h-28 md:h-36"
            priority
          />
          <div className="relative">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1.5 max-w-xs text-sm text-slate-300">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-9 sm:py-9">{children}</div>
      </div>
    </div>
  );
}
