"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "./gsap";

/**
 * The sticky header: tucks away while scrolling down, returns on scroll up, gains a frosted edge once the
 * page moves, and carries a violet reading-progress line along its bottom edge.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const header = ref.current;
      if (!header) return;
      const setScrolled = (y: number) => header.toggleAttribute("data-scrolled", y > 8);
      setScrolled(window.scrollY);

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            const y = self.scroll();
            setScrolled(y);
            const hide = self.direction === 1 && y > 240;
            gsap.to(header, { yPercent: hide ? -100 : 0, duration: 0.45, ease: "power3.out", overwrite: true });
          },
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        const onScroll = () => setScrolled(window.scrollY);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <header
      ref={ref}
      className="sticky top-0 z-40 bg-ground transition-[background-color,box-shadow] duration-300 data-[scrolled]:bg-ground/85 data-[scrolled]:shadow-[0_8px_30px_-12px_rgb(13_13_22/0.18)] data-[scrolled]:backdrop-blur-xl"
    >
      {children}
      <span ref={bar} aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-violet" />
    </header>
  );
}
