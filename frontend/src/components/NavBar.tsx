"use client";

import Link from "next/link";

import { useAuth } from "@/components/AuthProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/lib/locale";

export function NavBar() {
  const { t } = useI18n();
  const { user, loading } = useAuth();

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/chat", label: t.nav.chat },
    { href: "/diagnose", label: t.nav.diagnose },
    { href: "/soil", label: t.nav.soil },
    { href: "/map", label: t.nav.map },
    { href: "/schemes", label: t.nav.schemes },
    { href: "/reports", label: t.nav.reports },
    { href: "/places", label: t.nav.places },
    { href: "/tasks", label: t.nav.tasks },
  ];

  return (
    <header className="site-header">
      <nav className="nav" aria-label={t.nav.label}>
        <Link className="brand" href="/">
          {t.brand}
        </Link>
        <div className="nav-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <LanguageToggle />
          {loading ? null : (
            <Link className="nav-auth" href={user ? "/dashboard" : "/login"}>
              {user ? t.nav.dashboard : t.nav.login}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
