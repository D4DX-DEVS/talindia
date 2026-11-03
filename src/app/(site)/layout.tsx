import { Suspense } from "react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter, SiteFooterSkeleton } from "@/components/site/footer";
import { SiteMotion } from "@/components/motion/site-motion";
import { CustomCursor } from "@/components/motion/custom-cursor";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteMotion />
      <CustomCursor />
      <SiteHeader />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Suspense fallback={<SiteFooterSkeleton />}>
        <SiteFooter />
      </Suspense>
    </>
  );
}
