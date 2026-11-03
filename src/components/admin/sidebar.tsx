"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { logout } from "@/app/admin/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./nav";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {ADMIN_NAV.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1 text-xs font-semibold text-muted-foreground">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === "/admin/" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(item.href.replace(/\/$/, ""));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                      active ? "bg-sidebar-accent text-indigo" : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Footer({ email }: { email: string }) {
  return (
    <div className="space-y-1 border-t p-3">
      <a href="/" target="_blank" rel="noopener" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-sidebar-accent">
        <ExternalLink className="size-4" aria-hidden /> View website
      </a>
      <form action={logout}>
        <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-sidebar-accent">
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </form>
      <p className="truncate px-3 pt-1 text-xs text-muted-foreground" title={email}>{email}</p>
    </div>
  );
}

const brand = <Image src="/brand/logo-dark.webp" alt="Talindia" width={367} height={73} unoptimized className="h-6 w-auto" />;

export function AdminSidebar({ email }: { email: string }) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <Link href="/admin/" className="flex h-14 items-center border-b px-6">{brand}</Link>
      <NavList />
      <Footer email={email} />
    </aside>
  );
}

export function AdminMobileBar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-sidebar px-4 lg:hidden">
      <Link href="/admin/">{brand}</Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-lg" aria-label="Open admin menu"><Menu /></Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Admin</SheetTitle>
            <SheetDescription className="sr-only">Admin navigation</SheetDescription>
          </SheetHeader>
          <NavList onNavigate={() => setOpen(false)} />
          <Footer email={email} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
