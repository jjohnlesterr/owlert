import { DesktopSidebar } from "@/components/nav/desktop-sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 bg-background">
      <DesktopSidebar />
      <div className="flex min-h-full flex-1 flex-col md:ml-64">
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-10 md:pb-10 md:pt-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
