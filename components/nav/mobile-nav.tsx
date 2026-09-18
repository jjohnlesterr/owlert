"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/nav/nav-items";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-slate-200/80 bg-white shadow-[0_-2px_12px_rgba(15,27,51,0.08)] pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around px-2 pt-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`mx-auto flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive ? "text-navy" : "text-slate-400 hover:text-slate-600"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-navy/[0.08]" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
