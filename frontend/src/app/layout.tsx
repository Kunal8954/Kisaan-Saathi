import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { NavBar } from "@/components/NavBar";
import { getDictionary } from "@/lib/i18n";

import "./globals.css";

const dictionary = getDictionary("hi");

export const metadata: Metadata = {
  title: {
    default: "Kisan Saathi",
    template: "%s | Kisan Saathi",
  },
  description: "Hindi-first AI farming advisor for Indian farmers.",
  manifest: "/manifest.json",
  applicationName: "Kisan Saathi",
  appleWebApp: {
    capable: true,
    title: "Kisan Saathi",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f6f43",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi">
      <body>
        <NavBar />
        <main className="page">{children}</main>
        <footer className="site-footer">{dictionary.footer}</footer>
      </body>
    </html>
  );
}
