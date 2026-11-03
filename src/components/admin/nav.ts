import {
  Activity,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageSquareQuote,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  { label: "Overview", items: [{ href: "/admin/", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Content",
    items: [
      { href: "/admin/courses/", label: "Trainings", icon: GraduationCap },
      { href: "/admin/services/", label: "Services", icon: Wrench },
      { href: "/admin/highlights/", label: "Highlights", icon: ListChecks },
      { href: "/admin/testimonials/", label: "Testimonials", icon: MessageSquareQuote },
      { href: "/admin/pages/", label: "Pages", icon: FileText },
      { href: "/admin/media/", label: "Media library", icon: ImageIcon },
    ],
  },
  {
    label: "Forms",
    items: [
      { href: "/admin/enquiries/", label: "Enquiries", icon: Inbox },
      { href: "/admin/subscribers/", label: "Subscribers", icon: Mail },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings/", label: "Site & SEO settings", icon: Settings },
      { href: "/admin/activity/", label: "Activity log", icon: Activity },
    ],
  },
];
