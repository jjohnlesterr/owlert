"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/nav/nav-items";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-400"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
