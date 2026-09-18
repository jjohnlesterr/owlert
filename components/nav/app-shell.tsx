"use client";

import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DesktopSidebar } from "@/components/nav/desktop-sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";
import { useSidebar } from "@/components/nav/sidebar-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  // Home builds its own full-bleed hero with a logoname+bell row baked in
  // (see app/(app)/page.tsx), so the generic header would just duplicate
  // that — every other mobile page still gets it.
  const isHome = usePathname() === "/";

  return (
    <div className="flex min-h-full flex-1 bg-background">
      <DesktopSidebar />
      <div
        className={`flex min-h-full flex-1 flex-col transition-[margin-left] duration-200 ease-in-out ${
          collapsed ? "md:ml-[4.5rem]" : "md:ml-64"
        }`}
      >
        {!isHome && (
          <header className="flex items-center justify-between px-4 py-3 md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/mascot/beealert-logo.png"
                alt="BeeAlert"
                width={28}
                height={28}
                className="h-7 w-7 rounded-lg"
              />
              <span className="text-sm font-semibold text-navy">BeeAlert</span>
            </Link>
            <button
              type="button"
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy shadow-[0_1px_2px_rgba(15,27,51,0.08)] transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              <Bell className="h-4 w-4" />
            </button>
          </header>
        )}
        <main className="flex-1 px-4 pb-24 pt-2 sm:px-6 sm:pt-6 md:px-10 md:pb-10 md:pt-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
