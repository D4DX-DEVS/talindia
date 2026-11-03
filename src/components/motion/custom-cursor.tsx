"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

const SNAP = "[data-magnetic], button, [role=button]";
const LINK = "a, label, summary";
const TEXT_ENTRY = "input, textarea, select, [contenteditable=true]";
const DOT = 14;

type Mode = "dot" | "snap" | "lens" | "label" | "caret" | "hidden";

/**
 * One morphing cursor for mouse users. A small dot that stretches along its direction of travel; over buttons it
 * locks onto the button and wraps it as an outline; over links it swells into an inverting lens; over text fields
 * it becomes a caret; over `[data-cursor]` elements it turns into a violet bubble with that label.
 * The native cursor is only hidden while this runs (`html.has-cursor`).
 */
export function CustomCursor() {
  const root = useRef<HTMLDivElement>(null);
  const stretch = useRef<HTMLDivElement>(null);
  const shape = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and (pointer: fine)`, () => {
      const html = document.documentElement;
      html.classList.add("has-cursor");
      gsap.set(root.current, { autoAlpha: 0 });

      const posX = gsap.quickTo(root.current, "x", { duration: 0.18, ease: "power3" });
      const posY = gsap.quickTo(root.current, "y", { duration: 0.18, ease: "power3" });
      const rot = gsap.quickSetter(stretch.current, "rotate", "deg");
      const sx = gsap.quickTo(stretch.current, "scaleX", { duration: 0.25, ease: "power3" });
      const sy = gsap.quickTo(stretch.current, "scaleY", { duration: 0.25, ease: "power3" });

      let mode: Mode | null = null;
      let snapped: HTMLElement | null = null;
      let last = { x: 0, y: 0 };

      const morph = (next: Mode, el?: HTMLElement) => {
        const r = el?.getBoundingClientRect();
        const same = next === mode && (next !== "snap" || el === snapped);
        snapped = next === "snap" ? (el ?? null) : null;
        if (same) return;
        mode = next;
        // Only the dot leans into its direction of travel; every other shape sits upright.
        if (next !== "dot") gsap.to(stretch.current, { rotate: 0, duration: 0.3, ease: "power3.out" });
        const blend = next === "label" ? "normal" : "difference";
        const base = { duration: 0.4, ease: "expo.out", overwrite: "auto" as const };
        gsap.set(shape.current, { mixBlendMode: blend });
        gsap.to(root.current, { autoAlpha: next === "hidden" ? 0 : 1, duration: 0.2 });
        gsap.to(label.current, { autoAlpha: next === "label" ? 1 : 0, scale: next === "label" ? 1 : 0.6, duration: 0.3 });

        if (next === "snap" && r && el) {
          gsap.to(shape.current, {
            ...base,
            width: r.width + 12,
            height: r.height + 12,
            borderRadius: Math.min(parseFloat(getComputedStyle(el).borderRadius) || 12, (r.height + 12) / 2) + 6,
            backgroundColor: "rgb(255 255 255 / 0)",
            borderWidth: 1.5,
          });
          return;
        }
        const size = { dot: DOT, lens: 56, label: 92, caret: 3, hidden: DOT, snap: DOT }[next];
        gsap.to(shape.current, {
          ...base,
          width: size,
          height: next === "caret" ? 28 : size,
          borderRadius: next === "caret" ? 2 : size / 2,
          backgroundColor: next === "label" ? "rgb(91 3 255 / 1)" : "rgb(255 255 255 / 1)",
          borderWidth: 0,
        });
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const target = e.target as Element | null;
        const labelled = target?.closest<HTMLElement>("[data-cursor]");
        const snapEl = target?.closest<HTMLElement>(SNAP);

        if (target?.closest(TEXT_ENTRY)) morph("caret");
        else if (labelled) {
          if (label.current) label.current.firstChild!.textContent = labelled.dataset.cursor ?? "";
          morph("label");
        } else if (snapEl) morph("snap", snapEl);
        else if (target?.closest(LINK)) morph("lens");
        else morph("dot");

        if (snapped) {
          // Locked on: sit on the button's centre, leaning a little toward the pointer.
          const r = snapped.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          posX(cx + (e.clientX - cx) * 0.12);
          posY(cy + (e.clientY - cy) * 0.12);
          sx(1);
          sy(1);
        } else {
          posX(e.clientX);
          posY(e.clientY);
          const dx = e.clientX - last.x;
          const dy = e.clientY - last.y;
          const speed = Math.min(Math.hypot(dx, dy) / 40, 0.55);
          if (mode === "dot" && speed > 0.02) rot((Math.atan2(dy, dx) * 180) / Math.PI);
          sx(mode === "dot" ? 1 + speed : 1);
          sy(mode === "dot" ? 1 - speed * 0.5 : 1);
        }
        last = { x: e.clientX, y: e.clientY };
      };

      const onDown = () => gsap.fromTo(shape.current, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.45)" });
      const onLeave = () => morph("hidden");
      // Scrolling moves elements under a still pointer, so let the next move re-resolve the target.
      const onScroll = () => {
        if (snapped) morph("dot");
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("scroll", onScroll, { passive: true });
      html.addEventListener("pointerleave", onLeave);
      return () => {
        html.classList.remove("has-cursor");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("scroll", onScroll);
        html.removeEventListener("pointerleave", onLeave);
      };
    });
    return () => mm.revert();
  });

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed top-0 left-0 z-[100] hidden [.has-cursor_&]:block">
      <div ref={stretch} className="absolute top-0 left-0">
        <div
          ref={shape}
          className="absolute top-0 left-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border-solid border-white bg-white mix-blend-difference"
          style={{ width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 0 }}
        >
          <span ref={label} className="inline-flex items-center gap-1 text-sm font-bold whitespace-nowrap text-white opacity-0">
            <span />
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
