import {
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Globe,
  GraduationCap,
  Hammer,
  Handshake,
  MonitorPlay,
  Presentation,
  Rocket,
  Sparkles,
  TrendingUp,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";

/** Icons the CMS can assign to services and highlights (stored by name in D1). */
export const ICONS: Record<string, LucideIcon> = {
  "badge-check": BadgeCheck,
  "book-open-check": BookOpenCheck,
  "briefcase-business": BriefcaseBusiness,
  "building-2": Building2,
  globe: Globe,
  "graduation-cap": GraduationCap,
  hammer: Hammer,
  handshake: Handshake,
  "monitor-play": MonitorPlay,
  presentation: Presentation,
  rocket: Rocket,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
  "user-round-cog": UserRoundCog,
};

export const ICON_NAMES = Object.keys(ICONS);

export function CmsIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon aria-hidden className={className} />;
}
