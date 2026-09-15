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
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-100/70 via-blue-50/30 to-transparent"
      />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-lg shadow-slate-200/60 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/mascot/owlert-default.png"
            alt="Owlert mascot"
            width={88}
            height={88}
            className="h-20 w-20"
            priority
          />
          <h1 className="mt-4 text-2xl font-semibold text-navy">{title}</h1>
          <p className="mt-1.5 max-w-xs text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
