import type { MetadataRoute } from "next";
import { getCourses, getCustomPageSlugs, getServices, serviceHasPage } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, services, pages] = await Promise.all([
    getCourses({ search: "", page: 1, pageSize: 100 }),
    getServices(),
    getCustomPageSlugs(),
  ]);
  const latest = [...courses.data.map((c) => c.updatedAt), ...services.map((s) => s.updatedAt)].sort((a, b) => +b - +a)[0];
  return [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about-us/"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/trainings/"), lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/contact/"), changeFrequency: "yearly", priority: 0.6 },
    ...courses.data.map((c) => ({ url: absoluteUrl(`/courses/${c.slug}/`), lastModified: c.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...services.filter(serviceHasPage).map((s) => ({ url: absoluteUrl(`/all-service/${s.slug}/`), lastModified: s.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...pages.map((p) => ({ url: absoluteUrl(`/${p.slug}/`), lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
