import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Owlert",
  description:
    "Owlert helps you track weather updates, advisories, and class suspension announcements from trusted sources.",
  icons: {
    icon: "/mascot/owlert-logo.png",
    shortcut: "/mascot/owlert-logo.png",
    apple: "/mascot/owlert-logo.png",
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
