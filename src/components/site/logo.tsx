import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  tone?: "dark" | "light";
  className?: string;
  priority?: boolean;
}

/** The original Talindia logo (logo.png on dark text, logo1.png on light text). */
export function Logo({ tone = "dark", className, priority }: LogoProps) {
  return (
    <Link href="/" aria-label="Talindia home" className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src={tone === "dark" ? "/brand/logo-dark.webp" : "/brand/logo-light.webp"}
        alt="Talindia"
        width={367}
        height={73}
        priority={priority}
        unoptimized
        className="h-7 w-auto sm:h-8"
      />
    </Link>
  );
}
