import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "ink" | "light" | "ghost-light";

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  className?: string;
}

const variants: Record<Variant, string> = {
  solid: "bg-violet text-white hover:bg-white hover:text-ink",
  ink: "bg-ink text-white hover:bg-violet",
  light: "bg-white text-ink hover:bg-violet hover:text-white",
  "ghost-light": "bg-white/10 text-white hover:bg-white hover:text-ink",
};

const sizes = {
  sm: "min-h-11 pl-5 pr-4 text-sm",
  md: "min-h-12 pl-6 pr-5 text-base",
  lg: "min-h-14 pl-7 pr-6 text-lg",
};

/** The one public button shape: a pill, from the circle in the Talindia mark. */
export function ButtonLink({ href, children, variant = "solid", size = "md", arrow = true, className }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      data-magnetic
      className={cn(
        "group inline-flex items-center justify-center gap-3 rounded-full font-bold transition-colors duration-200 active:scale-[0.97]",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
      {arrow && (
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-current/15 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
          <ArrowRight className="size-4" />
        </span>
      )}
    </Link>
  );
}
