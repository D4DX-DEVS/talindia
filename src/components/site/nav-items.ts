export interface NavItem {
  href: string;
  label: string;
}

// Labels kept from the WordPress menu.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about-us/", label: "About Us" },
  { href: "/trainings/", label: "Trainings" },
];

export const NAV_ACTION: NavItem = { href: "/contact/", label: "Connect With Us" };
