import Link from "next/link";

import { getDictionary } from "@/lib/i18n";

const dictionary = getDictionary("hi");

const links = [
  { href: "/", label: dictionary.nav.home },
  { href: "/chat", label: dictionary.nav.chat },
  { href: "/diagnose", label: dictionary.nav.diagnose },
  { href: "/soil", label: dictionary.nav.soil },
  { href: "/map", label: dictionary.nav.map },
  { href: "/schemes", label: dictionary.nav.schemes },
];

export function NavBar() {
  return (
    <header className="site-header">
      <nav className="nav" aria-label="Main navigation">
        <Link className="brand" href="/">
          {dictionary.brand}
        </Link>
        <div className="nav-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
