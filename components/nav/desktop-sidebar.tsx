"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/nav/nav-items";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy px-4 py-6 md:flex">
      <Link href="/" className="flex items-center px-2">
        <Image
          src="/mascot/owlert-logoname.png"
          alt="Owlert"
          width={168}
          height={56}
          priority
          className="h-9 w-auto object-contain"
        />
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Primary">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="px-2 text-xs text-slate-400">
        Trusted weather &amp; class alerts, all in one place.
      </p>
    </aside>
  );
}
