"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/nav/nav-items";
import { useSidebar } from "@/components/nav/sidebar-context";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-navy py-7 transition-[width] duration-200 ease-in-out md:flex ${
        collapsed ? "w-[4.5rem] px-2.5" : "w-64 px-5"
      }`}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-3">
          <Link href="/" aria-label="BeeAlert home">
            <Image
              src="/mascot/beealert-logo.png"
              alt="BeeAlert"
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-lg object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-bee-yellow)]"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center">
            <Image
              src="/mascot/beealert-logoname-trimmed.png"
              alt="BeeAlert"
              width={194}
              height={52}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-bee-yellow)]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}

      <nav
        className="mt-10 flex flex-1 flex-col gap-1"
        aria-label="Primary"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <div key={href} className="group relative">
              <Link
                href={href}
                aria-label={collapsed ? label : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-bee-yellow)] ${
                  collapsed
                    ? "mx-auto h-10 w-10 justify-center"
                    : "gap-3 py-2.5 pl-3.5 pr-3"
                } ${
                  isActive
                    ? "bg-white/[0.07] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--color-bee-yellow)] transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {!collapsed && label}
              </Link>

              {collapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-navy-deep px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <p className="text-xs text-slate-500">Trusted alerts, one place.</p>
      )}
    </aside>
  );
}
