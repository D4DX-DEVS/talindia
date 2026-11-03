import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  href: string;
  label: string;
}

interface PageHeaderProps {
  title: string;
  intro?: string | null;
  crumbs?: Crumb[];
  children?: React.ReactNode;
}

/** Inner-page opening: breadcrumb, an oversized two-line title, one supporting sentence. */
export function PageHeader({ title, intro, crumbs = [], children }: PageHeaderProps) {
  return (
    <header className="bg-ground pt-10 pb-14 sm:pt-14 sm:pb-20">
      <div className="frame">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="crumbs-in flex flex-wrap items-center gap-1 text-base text-soft">
            <li>
              <Link href="/" className="inline-flex min-h-11 items-center hover:text-violet">Home</Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.href} className="flex items-center gap-1">
                <ChevronRight className="size-4" aria-hidden />
                <Link href={c.href} className="inline-flex min-h-11 items-center hover:text-violet">{c.label}</Link>
              </li>
            ))}
            <li className="flex items-center gap-1" aria-current="page">
              <ChevronRight className="size-4" aria-hidden />
              <span className="font-semibold text-ink">{title}</span>
            </li>
          </ol>
        </nav>
        <h1 className="display max-w-[18ch] text-[13vw] text-ink sm:text-[8vw] lg:text-[clamp(64px,7vw,120px)]">
          <span className="line-mask"><span>{title}</span></span>
        </h1>
        {intro && <p className="fade-up-late mt-8 max-w-2xl text-xl leading-relaxed text-ink">{intro}</p>}
        {children}
      </div>
    </header>
  );
}
