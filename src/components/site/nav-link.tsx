"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
}

export function NavLink({ href, children, className, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/\/$/, ""));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "relative inline-flex min-h-11 items-center text-[15px] font-semibold text-ink transition-colors hover:text-violet",
        "after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:bg-violet after:transition-transform after:duration-300 hover:after:scale-x-100",
        active && "text-violet after:scale-x-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}
