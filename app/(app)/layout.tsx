import { AppShell } from "@/components/nav/app-shell";
import { SidebarProvider } from "@/components/nav/sidebar-context";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppShell>{children}</AppShell>
    </SidebarProvider>
  );
}
