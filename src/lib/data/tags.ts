/** Cache tags shared by the public loaders and the admin mutations that invalidate them. */
export const TAGS = {
  settings: "settings",
  pages: "pages",
  page: (slug: string) => `page:${slug}`,
  courses: "courses",
  course: (slug: string) => `course:${slug}`,
  services: "services",
  features: "features",
  testimonials: "testimonials",
  media: "media",
} as const;
