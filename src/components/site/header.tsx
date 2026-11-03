import { Suspense } from "react";
import Link from "next/link";
import { NAV_ACTION, NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";
import { MobileNav } from "./mobile-nav";
import { Logo } from "./logo";
import { ButtonLink } from "./button-link";
import { HeaderShell } from "@/components/motion/header-shell";

function PlainLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-ink hover:text-violet">
      {children}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <HeaderShell>
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <div className="frame flex h-16 items-center justify-between gap-6 sm:h-18">
        <Logo priority />
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {/* Active-link state needs the pathname, which is request data under cacheComponents. */}
          <Suspense fallback={NAV_ITEMS.map((item) => <PlainLink key={item.href} href={item.href}>{item.label}</PlainLink>)}>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </Suspense>
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href={NAV_ACTION.href} size="sm" className="hidden sm:inline-flex">
            {NAV_ACTION.label}
          </ButtonLink>
          <MobileNav />
        </div>
      </div>
    </HeaderShell>
  );
}
