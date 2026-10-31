"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const chromelessRoutes = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/dashboard",
]);

interface AppChromeProps {
  children: ReactNode;
  header: ReactNode;
  footer: string;
}

export function AppChrome({ children, header, footer }: AppChromeProps) {
  const pathname = usePathname();

  if (chromelessRoutes.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main className="page">{children}</main>
      <footer className="site-footer">{footer}</footer>
    </>
  );
}
