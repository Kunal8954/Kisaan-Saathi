"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useI18n } from "@/lib/locale";

const chromelessRoutes = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/dashboard",
]);

interface AppChromeProps {
  children: ReactNode;
  header: ReactNode;
}

export function AppChrome({ children, header }: AppChromeProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  if (chromelessRoutes.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main className="page">{children}</main>
      <footer className="site-footer">{t.footer}</footer>
    </>
  );
}
