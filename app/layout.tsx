import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { InstallButton } from "@/components/pwa/install-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeeAlert",
  description:
    "BeeAlert helps you track weather updates, advisories, and class suspension announcements from trusted sources.",
  icons: {
    icon: "/mascot/beealert-logo.png",
    shortcut: "/mascot/beealert-logo.png",
    apple: "/icon-192x192.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f1b33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RegisterServiceWorker />
        {children}
        <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
          <InstallButton />
        </div>
      </body>
    </html>
  );
}
