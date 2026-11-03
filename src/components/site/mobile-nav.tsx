"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ACTION, NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex size-11 items-center justify-center text-ink transition-colors hover:text-violet md:hidden"
        >
          <Menu className="size-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm rounded-none bg-ground p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-left text-base font-bold">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col px-6 pb-8">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} onNavigate={() => setOpen(false)} className="min-h-14 text-3xl font-extrabold tracking-tight after:hidden">
              {item.label}
            </NavLink>
          ))}
          <Link
            href={NAV_ACTION.href}
            onClick={() => setOpen(false)}
            className="mt-8 inline-flex min-h-13 items-center justify-between bg-violet px-5 text-lg font-bold text-white transition-colors hover:bg-indigo"
          >
            {NAV_ACTION.label}
            <ArrowRight className="size-5" />
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
