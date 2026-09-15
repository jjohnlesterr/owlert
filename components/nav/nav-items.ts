import { Home, ListChecks, RadioTower, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/updates", label: "Updates", icon: ListChecks },
  { href: "/sources", label: "Sources", icon: RadioTower },
  { href: "/profile", label: "Profile", icon: UserRound },
];
