import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppChrome } from "@/components/AppChrome";
import { AuthProvider } from "@/components/AuthProvider";
import { NavBar } from "@/components/NavBar";
import { getDictionary } from "@/lib/i18n";
import { LanguageProvider } from "@/lib/locale";

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
  themeColor: "#3b63e0",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <AppChrome header={<NavBar />} footer={dictionary.footer}>
              {children}
            </AppChrome>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
