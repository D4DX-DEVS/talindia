"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from "./gsap";

type Cleanup = () => void;
type Setup = (root: HTMLElement) => Cleanup | void;

const finePointer = () => window.matchMedia("(pointer: fine)").matches;

/** Hero: characters rise out of word masks, the violet disc spins open, the portrait follows the cursor. */
const hero: Setup = (root) => {
  const q = gsap.utils.selector(root);
  const [disc] = q("[data-m=disc]");
  const [portrait] = q("[data-m=portrait]");
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

  tl.from(disc, { scale: 0.35, rotate: -45, autoAlpha: 0, duration: 1.8 }, 0);
  q("[data-m=line]").forEach((line, i) => {
    // aria-label is not allowed on a <span>: hide the split line and let the <h1> carry the name.
    const split = SplitText.create(line, { type: "words,chars", mask: "words", aria: "hidden" });
    tl.from(split.chars, { yPercent: 115, rotate: 10, duration: 1.1, stagger: 0.024 }, 0.15 + i * 0.2);
  });
  tl.from(portrait, { y: 120, autoAlpha: 0, duration: 1.6 }, 0.25);
  tl.from(q("[data-m=fade]"), { y: 36, autoAlpha: 0, filter: "blur(8px)", duration: 1.2, stagger: 0.12 }, 0.7);

  const scroll = { trigger: root, start: "top top", end: "bottom top", scrub: true };
  gsap.to(disc, { yPercent: 14, ease: "none", scrollTrigger: scroll });
  gsap.to(portrait, { yPercent: 8, ease: "none", scrollTrigger: scroll });

  if (!finePointer()) return;
  const discX = gsap.quickTo(disc, "x", { duration: 1.4, ease: "power3" });
  const discY = gsap.quickTo(disc, "y", { duration: 1.4, ease: "power3" });
  const portraitX = gsap.quickTo(portrait, "x", { duration: 1, ease: "power3" });
  const onMove = (e: PointerEvent) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    discX(nx * -50);
    discY(ny * -40);
    portraitX(nx * 24);
  };
  root.addEventListener("pointermove", onMove);
  return () => root.removeEventListener("pointermove", onMove);
};

/** About: the light panel lifts and squares up, the statement fills in word by word as you read it. */
const about: Setup = (root) => {
  const q = gsap.utils.selector(root);
  const [panel] = q("[data-m=panel]");
  const [heading] = q("[data-m=heading]");

  gsap.from(panel, { scale: 0.92, y: 80, borderRadius: "7rem", ease: "none", scrollTrigger: { trigger: panel, start: "top bottom", end: "top 30%", scrub: 1 } });

  const split = SplitText.create(heading, { type: "words" });
  // 0.5 keeps the unread words at 3.5:1 on the light panel (WCAG large-text minimum is 3:1).
  gsap.from(split.words, { opacity: 0.5, stagger: 0.1, ease: "none", scrollTrigger: { trigger: heading, start: "top 85%", end: "bottom 40%", scrub: true } });

  gsap.from(q("[data-m=fade]"), { y: 30, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: heading, start: "bottom 80%" } });

  const services = q("[data-m=service]");
  const st = { trigger: services[0], start: "top 85%" };
  gsap.from(services, { x: 70, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, scrollTrigger: st });
  gsap.from(q("[data-m=service-img]"), { scale: 0, rotate: -120, duration: 0.9, ease: "back.out(1.8)", stagger: 0.1, delay: 0.15, scrollTrigger: st });

  const [illustration] = q("[data-m=illustration]");
  gsap.fromTo(illustration, { rotate: -24, scale: 0.85 }, { rotate: 8, scale: 1, ease: "none", scrollTrigger: { trigger: illustration, start: "top bottom", end: "bottom top", scrub: true } });
};

/** Trainings: letters scatter in, the count rolls up, cards wipe open in batches with a cursor spotlight. */
const trainings: Setup = (root) => {
  const q = gsap.utils.selector(root);
  const [heading] = q("[data-m=heading]");
  const split = SplitText.create(heading, { type: "words,chars", mask: "words" });
  gsap.from(split.chars, { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: { each: 0.03, from: "random" }, scrollTrigger: { trigger: heading, start: "top 85%" } });

  q("[data-m=count]").forEach((el) => {
    gsap.from(el, { textContent: 0, snap: { textContent: 1 }, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-m=card]"));
  gsap.set(cards, { clipPath: "inset(0% 100% 0% 0% round 2rem)", autoAlpha: 0 });
  ScrollTrigger.batch(cards, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, { clipPath: "inset(0% 0% 0% 0% round 2rem)", autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.12, clearProps: "clipPath" });
      gsap.from(batch.map((c) => c.querySelector("[data-m=thumb]")), { scale: 0, rotate: -90, duration: 1, ease: "back.out(1.6)", stagger: 0.12, delay: 0.2 });
    },
  });

  gsap.from(q("[data-m=fade]"), { y: 30, autoAlpha: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: q("[data-m=fade]")[0], start: "top 92%" } });

  const onMove = (e: PointerEvent) => {
    const card = (e.target as Element).closest<HTMLElement>(".spotlight");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  root.addEventListener("pointermove", onMove);
  return () => root.removeEventListener("pointermove", onMove);
};

/** Testimonials: words skew in, the lead quote comes into focus, the smaller cards flip up on a hinge. */
const testimonials: Setup = (root) => {
  const q = gsap.utils.selector(root);
  const [circle] = q("[data-m=circle]");
  gsap.fromTo(circle, { yPercent: -18, scale: 0.8 }, { yPercent: 16, scale: 1.05, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(q("[data-m=quote-icon]"), { rotate: -180, scale: 0, duration: 1.2, ease: "back.out(1.6)", scrollTrigger: { trigger: root, start: "top 70%" } });

  const [heading] = q("[data-m=heading]");
  const headingSplit = SplitText.create(heading, { type: "words" });
  gsap.from(headingSplit.words, { x: -60, skewX: 18, autoAlpha: 0, duration: 1, ease: "power4.out", stagger: 0.07, scrollTrigger: { trigger: heading, start: "top 85%" } });

  const [lead] = q("[data-m=lead]");
  const leadSplit = SplitText.create(lead, { type: "words" });
  gsap.from(leadSplit.words, { autoAlpha: 0, y: 12, filter: "blur(12px)", duration: 0.8, ease: "power2.out", stagger: 0.03, scrollTrigger: { trigger: lead, start: "top 80%" } });
  gsap.from(q("[data-m=lead-caption]"), { autoAlpha: 0, x: -20, duration: 0.8, delay: 0.6, scrollTrigger: { trigger: lead, start: "top 80%" } });

  const cards = q("[data-m=card]");
  if (cards.length) {
    gsap.set(cards[0].parentElement, { perspective: 1200 });
    gsap.from(cards, { rotationX: -75, transformOrigin: "50% 0%", y: 40, autoAlpha: 0, duration: 1.1, ease: "power3.out", stagger: 0.15, scrollTrigger: { trigger: cards[0], start: "top 88%" } });
  }
};

/** Closing tiles: the photographs part outward from behind the accent tile, which opens as a growing circle. */
const cta: Setup = (root) => {
  const q = gsap.utils.selector(root);
  const scrub = { trigger: root, start: "top bottom", end: "center center", scrub: 1 };
  gsap.from(q("[data-m=photo-l]"), { xPercent: 70, rotate: -8, scale: 0.8, ease: "none", scrollTrigger: scrub });
  gsap.from(q("[data-m=photo-r]"), { xPercent: -70, rotate: 8, scale: 0.8, ease: "none", scrollTrigger: scrub });
  gsap.from(q("[data-m=photo-l] img, [data-m=photo-r] img"), { scale: 1.35, ease: "none", scrollTrigger: scrub });

  const [tile] = q("[data-m=tile]");
  const [heading] = q("[data-m=heading]");
  const split = SplitText.create(heading, { type: "words,chars", mask: "words" });
  const tl = gsap.timeline({ scrollTrigger: { trigger: tile, start: "top 80%" } });
  tl.fromTo(tile, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 1.3, ease: "expo.inOut", clearProps: "clipPath" })
    .from(split.chars, { yPercent: 100, duration: 0.7, ease: "power3.out", stagger: { each: 0.02, ease: "sine.in" } }, "-=0.5")
    .from(q("[data-m=fade]"), { y: 24, autoAlpha: 0, duration: 0.7, ease: "power3.out", stagger: 0.1 }, "-=0.4");
};

/** Footer: the giant wordmark letters rise out of the floor as the footer scrolls in. */
const footer: Setup = (root) => {
  const q = gsap.utils.selector(root);
  gsap.from(q("[data-m=col]"), { y: 40, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: root, start: "top 85%" } });
  const [mark] = q("[data-m=wordmark]");
  const split = SplitText.create(mark, { type: "chars", mask: "chars" });
  gsap.from(split.chars, { yPercent: 100, ease: "none", stagger: 0.06, scrollTrigger: { trigger: mark, start: "top bottom", end: "bottom 95%", scrub: 1 } });
};

/** About page reasons and offerings: rules draw across, then text follows; offering rows slide from the left. */
const whyOffer: Setup = (root) => {
  const q = gsap.utils.selector(root);
  q("[data-m=heading]").forEach((h) => {
    gsap.from(h, { y: 50, autoAlpha: 0, duration: 1, ease: "power4.out", scrollTrigger: { trigger: h, start: "top 85%" } });
  });
  q("[data-m=why]").forEach((item, i) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: "top 85%" }, delay: i * 0.12 });
    tl.from(item.querySelector("[data-m=rule]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 0.9, ease: "expo.out" })
      .from(item.querySelector("[data-m=index]"), { textContent: 0, snap: { textContent: 1 }, duration: 0.6 }, 0)
      .from(item.querySelectorAll("h3, p"), { y: 24, autoAlpha: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 0.25);
  });
  q("[data-m=offer]").forEach((row) => {
    gsap.from(row, { x: -80, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: row, start: "top 90%" } });
  });
};

const setups = { hero, about, trainings, testimonials, cta, footer, whyOffer } satisfies Record<string, Setup>;

export type MotionKind = keyof typeof setups;

interface SectionMotionProps {
  kind: MotionKind;
  children: React.ReactNode;
  /** Above-the-fold content stays hidden (with a CSS failsafe) until the intro timeline is ready. */
  hideUntilReady?: boolean;
}

/** A layout-free wrapper (display: contents) that scopes one section's GSAP choreography to its children. */
export function SectionMotion({ kind, children, hideUntilReady = false }: SectionMotionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      // The wrapper has no box of its own, so triggers measure the section it holds.
      const section = root.firstElementChild instanceof HTMLElement ? root.firstElementChild : root;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => setups[kind](section));
      gsap.set(root, { visibility: "visible" });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="contents" data-reveal-hide={hideUntilReady || undefined}>
      {children}
    </div>
  );
}
